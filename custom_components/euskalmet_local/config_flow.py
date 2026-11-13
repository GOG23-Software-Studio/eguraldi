from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import aiohttp
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.config_entries import ConfigFlowResult
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)
from homeassistant.util import dt as dt_util

from .api import (
    EuskalmetAPI,
    EuskalmetAPIError,
    EuskalmetAuthenticationError,
    EuskalmetConnectionError,
)
from .const import DOMAIN, MEASURES
from .geography import LocationDiscoveryError
from .home_location import home_entry_data, resolve_home
from .locality import rank_stations, resolve_forecast, search_localities
from .pem import normalize_pem

EMAIL_SELECTOR = TextSelector(TextSelectorConfig(type=TextSelectorType.EMAIL))
PRIVATE_KEY_SELECTOR = TextSelector(TextSelectorConfig(multiline=True))


def _is_valid_private_key(pem: str) -> bool:
    """Comprobar que la clave se puede cargar como clave privada."""

    from cryptography.hazmat.primitives.serialization import (
        load_pem_private_key,
    )

    try:
        load_pem_private_key(pem.encode(), password=None)
    except (ValueError, TypeError):
        return False
    return True


def _clean_credentials(user_input: dict[str, Any]) -> dict[str, Any]:
    """Limpiar el correo y reconstruir la clave PEM pegada."""

    return {
        **user_input,
        "email": user_input["email"].strip(),
        "private_key": normalize_pem(user_input["private_key"]),
    }


EU_MEASURE_NAMES = {
    "temperature": "Tenperatura",
    "humidity": "Hezetasuna",
    "pressure": "Presioa",
    "wind_speed": "Haizearen abiadura",
    "wind_gust": "Haize-bolada handiena",
    "wind_direction": "Haizearen norabidea",
    "irradiance": "Eguzki-erradiazioa",
    "precipitation": "Prezipitazioa",
}


class EuskalmetConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Configurar credenciales y una estación meteorológica elegida."""

    VERSION = 2

    def __init__(self) -> None:
        """Inicializar el flujo de dos pasos."""

        self._credentials: dict[str, Any] = {}
        self._api: EuskalmetAPI | None = None
        self._stations: list[dict[str, Any]] = []
        self._selected_station: dict[str, Any] | None = None

    def _measure_names(self, keys: list[str]) -> str:
        """Mostrar nombres legibles de una lista de magnitudes."""

        use_eu = str(self.hass.config.language).lower().startswith("eu")
        return ", ".join(
            EU_MEASURE_NAMES[key] if use_eu else str(MEASURES[key]["name"])
            for key in keys
        )

    def _station_status(self, station: dict[str, Any]) -> str:
        """Resumir capacidades sin hacer excesivamente largo el selector."""

        available = station["available_measures"]
        missing = station["missing_measures"]
        count = f"{len(available)}/{len(MEASURES)}"
        use_eu = str(self.hass.config.language).lower().startswith("eu")

        if not missing:
            return f"{count} osoa" if use_eu else f"{count} completa"
        if len(available) <= 3:
            qualifier = "soilik" if use_eu else "solo"
            return f"{count} · {qualifier} {self._measure_names(available)}"
        qualifier = "gabe" if use_eu else "sin"
        return f"{count} · {qualifier} {self._measure_names(missing)}"

    async def _async_create_selected_entry(self) -> ConfigFlowResult:
        """Resolver los catálogos y crear la entrada seleccionada."""

        if self._api is None or self._selected_station is None:
            return await self.async_step_user()

        station = self._selected_station
        station_id = station["station_id"]
        detected = await self._api.discover_configuration_for_station(station_id)

        if any(
            entry.data.get("station_id") == station_id
            for entry in self._async_current_entries()
        ):
            return self.async_abort(reason="already_configured")

        await self.async_set_unique_id(station_id)
        self._abort_if_unique_id_configured()
        return self.async_create_entry(
            title=f"Euskalmet - {station['station_name']}",
            data={
                **self._credentials,
                **detected,
                "latitude": station["station_latitude"],
                "longitude": station["station_longitude"],
                "available_measures": station["available_measures"],
            },
        )

    async def async_step_user(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> ConfigFlowResult:
        """Validar las credenciales y preparar la lista de estaciones."""

        errors: dict[str, str] = {}

        if (
            user_input is None
            and not getattr(self, "_account_chosen", False)
            and self.hass.config_entries.async_entries(DOMAIN)
        ):
            return await self.async_step_account()

        if user_input is not None:
            user_input = _clean_credentials(user_input)
            if not await self.hass.async_add_executor_job(
                _is_valid_private_key, user_input["private_key"]
            ):
                errors["private_key"] = "invalid_private_key"

        if user_input is not None and not errors:
            api = EuskalmetAPI(
                session=async_get_clientsession(self.hass),
                email=user_input["email"],
                private_key=user_input["private_key"],
                time_zone=dt_util.get_default_time_zone(),
            )

            try:
                await api.get_regions()
                stations = await api.list_compatible_stations()
            except EuskalmetAuthenticationError:
                errors["base"] = "invalid_auth"
            except (EuskalmetConnectionError, EuskalmetAPIError):
                errors["base"] = "cannot_connect"
            except LocationDiscoveryError:
                errors["base"] = "cannot_load_stations"
            else:
                if not stations:
                    errors["base"] = "no_compatible_stations"
                else:
                    self._credentials = dict(user_input)
                    self._api = api
                    self._stations = stations
                    return await self.async_step_location_source()

        return self.async_show_form(
            step_id="user",
            description_placeholders={
                "api_keys_url": "https://api.euskadi.eus/opendata-apikey/#/"
            },
            data_schema=vol.Schema(
                {
                    vol.Required("email"): EMAIL_SELECTOR,
                    vol.Required("private_key"): PRIVATE_KEY_SELECTOR,
                }
            ),
            errors=errors,
        )

    async def async_step_reauth(
        self,
        entry_data: Mapping[str, Any],
    ) -> ConfigFlowResult:
        """Iniciar la reautenticación cuando Euskalmet rechaza el JWT."""

        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> ConfigFlowResult:
        """Pedir de nuevo el correo y la clave privada."""

        entry = self._get_reauth_entry()
        errors: dict[str, str] = {}

        if user_input is not None:
            user_input = _clean_credentials(user_input)
            if not await self.hass.async_add_executor_job(
                _is_valid_private_key, user_input["private_key"]
            ):
                errors["private_key"] = "invalid_private_key"

        if user_input is not None and not errors:
            api = EuskalmetAPI(
                session=async_get_clientsession(self.hass),
                email=user_input["email"],
                private_key=user_input["private_key"],
                time_zone=dt_util.get_default_time_zone(),
            )
            try:
                await api.get_regions()
            except EuskalmetAuthenticationError:
                errors["base"] = "invalid_auth"
            except (EuskalmetConnectionError, EuskalmetAPIError):
                errors["base"] = "cannot_connect"
            else:
                return self.async_update_reload_and_abort(
                    entry,
                    data_updates={
                        "email": user_input["email"],
                        "private_key": user_input["private_key"],
                    },
                )

        return self.async_show_form(
            step_id="reauth_confirm",
            description_placeholders={
                "api_keys_url": "https://api.euskadi.eus/opendata-apikey/#/"
            },
            data_schema=self.add_suggested_values_to_schema(
                vol.Schema(
                    {
                        vol.Required("email"): EMAIL_SELECTOR,
                        vol.Required("private_key"): PRIVATE_KEY_SELECTOR,
                    }
                ),
                {"email": entry.data.get("email")},
            ),
            errors=errors,
        )

    async def async_step_station(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> ConfigFlowResult:
        """Elegir una estación compatible y crear una entrada independiente."""

        if self._api is None or not self._stations:
            return await self.async_step_user()

        errors: dict[str, str] = {}

        if user_input is not None:
            station_id = user_input["station_id"]
            station = next(
                (item for item in self._stations if item["station_id"] == station_id),
                None,
            )

            if station is None:
                errors["base"] = "station_not_available"
            else:
                self._selected_station = station

                if station["missing_measures"]:
                    return await self.async_step_confirm()

                try:
                    return await self._async_create_selected_entry()
                except EuskalmetAuthenticationError:
                    errors["base"] = "invalid_auth"
                except (EuskalmetConnectionError, EuskalmetAPIError):
                    errors["base"] = "cannot_connect"
                except (LocationDiscoveryError, TypeError, ValueError):
                    errors["base"] = "cannot_determine_location"

        options = [
            SelectOptionDict(
                value=station["station_id"],
                label=(
                    f"{station['station_name']} — "
                    f"{station['municipality']} — "
                    f"{self._station_status(station)}"
                ),
            )
            for station in self._stations
        ]

        return self.async_show_form(
            step_id="station",
            data_schema=vol.Schema(
                {
                    vol.Required("station_id"): SelectSelector(
                        SelectSelectorConfig(options=options)
                    )
                }
            ),
            errors=errors,
            description_placeholders={
                "station_count": str(len(options)),
            },
        )

    async def async_step_confirm(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> ConfigFlowResult:
        """Confirmar conscientemente una estación con datos incompletos."""

        if self._selected_station is None:
            return await self.async_step_station()

        errors: dict[str, str] = {}
        station = self._selected_station

        if user_input is not None:
            try:
                return await self._async_create_selected_entry()
            except EuskalmetAuthenticationError:
                errors["base"] = "invalid_auth"
            except (EuskalmetConnectionError, EuskalmetAPIError):
                errors["base"] = "cannot_connect"
            except (LocationDiscoveryError, TypeError, ValueError):
                errors["base"] = "cannot_determine_location"

        return self.async_show_form(
            step_id="confirm",
            data_schema=vol.Schema({}),
            errors=errors,
            description_placeholders={
                "station": station["station_name"],
                "available": self._measure_names(station["available_measures"]),
                "missing": self._measure_names(station["missing_measures"]),
            },
        )

    async def async_step_account(self, user_input=None):
        entries = self.hass.config_entries.async_entries(DOMAIN)
        if user_input is not None:
            self._account_chosen = True
            selected = next(
                (entry for entry in entries if entry.entry_id == user_input["account"]),
                None,
            )
            if selected is not None:
                # Reuse on the server; credentials are never sent to the browser.
                return await self.async_step_user(
                    {
                        "email": selected.data["email"],
                        "private_key": selected.data["private_key"],
                    }
                )
            return await self.async_step_user()
        return self.async_show_form(
            step_id="account",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        "account", default=entries[0].entry_id if entries else "new"
                    ): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                *[
                                    SelectOptionDict(
                                        value=entry.entry_id, label=entry.title
                                    )
                                    for entry in entries
                                ],
                                SelectOptionDict(
                                    value="new",
                                    label="Otra cuenta de Open Data Euskadi",
                                ),
                            ]
                        )
                    )
                }
            ),
        )

    async def async_step_location_source(self, user_input=None):
        if user_input is not None:
            if user_input["location_source"] == "home_assistant":
                return await self.async_step_home_assistant()
            return await self.async_step_locality()
        return self.async_show_form(
            step_id="location_source",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        "location_source", default="home_assistant"
                    ): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(
                                    value="home_assistant",
                                    label="Ubicación de Home Assistant · recomendada",
                                ),
                                SelectOptionDict(
                                    value="manual",
                                    label="Otra localidad · elegir por nombre",
                                ),
                            ]
                        )
                    )
                }
            ),
        )

    async def async_step_home_assistant(self, user_input=None):
        errors = {}
        try:
            place, ranked, forecast = await resolve_home(self.hass, self._api)
            self._place, self._ranked, self._forecast_location = place, ranked, forecast
            self._selected_station = ranked[0]
            return await self.async_step_recommendation()
        except (LocationDiscoveryError, OSError, ValueError):
            errors["base"] = "home_location_unavailable"
        except EuskalmetAuthenticationError:
            errors["base"] = "invalid_auth"
        except (EuskalmetAPIError, aiohttp.ClientError, TimeoutError):
            errors["base"] = "cannot_connect"
        return self.async_show_form(
            step_id="location_source",
            errors=errors,
            data_schema=vol.Schema(
                {
                    vol.Required("location_source", default="manual"): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(
                                    value="home_assistant",
                                    label="Ubicación de Home Assistant",
                                ),
                                SelectOptionDict(
                                    value="manual",
                                    label="Otra localidad · elegir por nombre",
                                ),
                            ]
                        )
                    )
                }
            ),
        )

    async def async_step_locality(self, user_input=None):
        """Ask for a municipality, never start with a station list."""
        errors = {}
        if user_input:
            try:
                self._places = await search_localities(
                    async_get_clientsession(self.hass), user_input["locality"]
                )
                if self._places:
                    return await self.async_step_place()
                errors["base"] = "locality_not_found"
            except (aiohttp.ClientError, TimeoutError, ValueError):
                errors["base"] = "cannot_geocode"
        return self.async_show_form(
            step_id="locality",
            errors=errors,
            data_schema=vol.Schema({vol.Required("locality"): str}),
        )

    async def async_step_place(self, user_input=None):
        """Disambiguate towns before selecting a station."""
        errors = {}
        if user_input:
            place = next(
                (p for p in self._places if p["id"] == user_input["place"]), None
            )
            if place:
                self._place = place
                ranked = rank_stations(
                    self._stations, place["latitude"], place["longitude"]
                )
                if not ranked:
                    errors["base"] = "no_nearby_station"
                else:
                    try:
                        self._forecast_location = await resolve_forecast(
                            self._api, place
                        )
                    except EuskalmetAuthenticationError:
                        errors["base"] = "invalid_auth"
                    except (EuskalmetAPIError, aiohttp.ClientError, TimeoutError):
                        errors["base"] = "cannot_connect"
                    except LocationDiscoveryError:
                        errors["base"] = "forecast_locality_not_found"
                    else:
                        self._ranked = ranked
                        self._selected_station = ranked[0]
                        return await self.async_step_recommendation()
        return self.async_show_form(
            step_id="place",
            errors=errors,
            data_schema=vol.Schema(
                {
                    vol.Required("place"): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(
                                    value=p["id"],
                                    label=(
                                        f"{p['name']} · {p['province']}"
                                        f" · {p['region_name']}"
                                    ),
                                )
                                for p in self._places
                            ]
                        )
                    )
                }
            ),
        )

    async def async_step_recommendation(self, user_input=None):
        """Explain the recommendation and allow an explicit station override."""
        if user_input:
            station_id = user_input["station_id"]
            self._selected_station = next(
                s for s in self._ranked if s["station_id"] == station_id
            )
            station = self._selected_station
            place = self._place
            await self.async_set_unique_id(f"locality_{place['id']}")
            self._abort_if_unique_id_configured()
            return self.async_create_entry(
                title=f"Eguraldi · {place['name']}",
                data={
                    **self._credentials,
                    **station,
                    **self._forecast_location,
                    "latitude": place["latitude"],
                    "longitude": place["longitude"],
                    "locality": place["name"],
                    "locality_id": place["id"],
                    "locality_province": place["province"],
                    "location_source": place.get("location_source", "manual"),
                    "recommended_station": self._ranked[0]["station_id"],
                    "selection_mode": "automatic"
                    if station_id == self._ranked[0]["station_id"]
                    else "manual",
                },
            )
        station = self._selected_station
        return self.async_show_form(
            step_id="recommendation",
            description_placeholders={
                "locality": self._place["name"],
                "station": station["station_name"],
                "distance": str(station["distance_km"]),
                "available": self._measure_names(station["available_measures"]),
                "missing": self._measure_names(station["missing_measures"]) or "—",
                "origin": (
                    "Ubicación de Home Assistant · geoEuskadi · "
                    "Eusko Jaurlaritza / Gobierno Vasco"
                )
                if self._place.get("location_source") == "home_assistant"
                else "Localidad elegida manualmente",
            },
            data_schema=vol.Schema(
                {
                    vol.Required(
                        "station_id", default=station["station_id"]
                    ): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(
                                    value=s["station_id"],
                                    label=(
                                        f"{s['station_name']} · "
                                        f"{s['distance_km']:.1f} km · "
                                        f"{self._station_status(s)}"
                                    ),
                                )
                                for s in self._ranked
                            ]
                        )
                    )
                }
            ),
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return EuskalmetLocalOptionsFlow()


class EuskalmetLocalOptionsFlow(config_entries.OptionsFlow):
    """Change locality or station without replacing the configured entry."""

    async def async_step_init(self, user_input=None):
        # Preserve direct submissions from an already open older options dialog.
        if user_input and "station_id" in user_input:
            return await self.async_step_station(user_input)
        return self.async_show_menu(
            step_id="init", menu_options=["home_assistant", "locality", "station"]
        )

    def _api_for_options(self):
        entry = self.config_entry
        return EuskalmetAPI(
            session=async_get_clientsession(self.hass),
            email=entry.data["email"],
            private_key=entry.data["private_key"],
            time_zone=dt_util.get_default_time_zone(),
        )

    async def async_step_home_assistant(self, user_input=None):
        try:
            place, ranked, forecast = await resolve_home(
                self.hass, self._api_for_options()
            )
        except (LocationDiscoveryError, OSError, ValueError):
            return self.async_show_form(
                step_id="home_assistant",
                errors={"base": "home_location_unavailable"},
                data_schema=vol.Schema({}),
            )
        except EuskalmetAuthenticationError:
            return self.async_show_form(
                step_id="home_assistant",
                errors={"base": "invalid_auth"},
                data_schema=vol.Schema({}),
            )
        except (EuskalmetAPIError, aiohttp.ClientError, TimeoutError):
            return self.async_show_form(
                step_id="home_assistant",
                errors={"base": "cannot_connect"},
                data_schema=vol.Schema({}),
            )
        entry = self.config_entry
        if any(
            other.entry_id != entry.entry_id
            and other.unique_id == "locality_home_assistant"
            for other in self.hass.config_entries.async_entries(DOMAIN)
        ):
            return self.async_abort(reason="already_configured")
        self._pending_locality = home_entry_data(entry.data, place, ranked, forecast)
        return await self.async_step_confirm_locality()

    async def async_step_locality(self, user_input=None):
        errors = {}
        if user_input is not None:
            try:
                self._places = await search_localities(
                    async_get_clientsession(self.hass), user_input["locality"]
                )
                if self._places:
                    return await self.async_step_place()
                errors["base"] = "locality_not_found"
            except (aiohttp.ClientError, TimeoutError, ValueError):
                errors["base"] = "cannot_geocode"
        return self.async_show_form(
            step_id="locality",
            errors=errors,
            data_schema=vol.Schema(
                {
                    vol.Required(
                        "locality", default=self.config_entry.data.get("locality", "")
                    ): str
                }
            ),
        )

    async def async_step_place(self, user_input=None):
        errors = {}
        if user_input is not None:
            place = next(
                (p for p in self._places if p["id"] == user_input["place"]), None
            )
            if place is None:
                errors["base"] = "locality_not_found"
            else:
                entry = self.config_entry
                if any(
                    other.entry_id != entry.entry_id
                    and other.unique_id == f"locality_{place['id']}"
                    for other in self.hass.config_entries.async_entries(DOMAIN)
                ):
                    return self.async_abort(reason="already_configured")
                try:
                    api = self._api_for_options()
                    stations = rank_stations(
                        await api.list_compatible_stations(),
                        place["latitude"],
                        place["longitude"],
                    )
                    if not stations:
                        errors["base"] = "no_nearby_station"
                    else:
                        forecast = await resolve_forecast(api, place)
                        station = stations[0]
                        self._pending_locality = {
                            **entry.data,
                            **station,
                            **forecast,
                            "latitude": place["latitude"],
                            "longitude": place["longitude"],
                            "locality": place["name"],
                            "locality_id": place["id"],
                            "locality_province": place["province"],
                            "location_source": place.get("location_source", "manual"),
                            "selection_mode": "automatic",
                            "recommended_station": station["station_id"],
                        }
                        return await self.async_step_confirm_locality()
                except EuskalmetAuthenticationError:
                    errors["base"] = "invalid_auth"
                except (EuskalmetAPIError, aiohttp.ClientError, TimeoutError):
                    errors["base"] = "cannot_connect"
                except LocationDiscoveryError:
                    errors["base"] = "forecast_locality_not_found"
        return self.async_show_form(
            step_id="place",
            errors=errors,
            data_schema=vol.Schema(
                {
                    vol.Required("place"): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(
                                    value=p["id"],
                                    label=(
                                        f"{p['name']} · {p['province']}"
                                        f" · {p['region_name']}"
                                    ),
                                )
                                for p in self._places
                            ]
                        )
                    )
                }
            ),
        )

    async def async_step_confirm_locality(self, user_input=None):
        data = self._pending_locality
        if user_input is not None:
            entry = self.config_entry
            if any(
                other.entry_id != entry.entry_id
                and other.unique_id == f"locality_{data['locality_id']}"
                for other in self.hass.config_entries.async_entries(DOMAIN)
            ):
                return self.async_abort(reason="already_configured")
            self.hass.config_entries.async_update_entry(
                entry,
                data=data,
                title=f"Eguraldi · {data['locality']}",
                unique_id=f"locality_{data['locality_id']}",
            )
            return self.async_create_entry(
                title="",
                data={"station_id": "automatic", "locality_id": data["locality_id"]},
            )
        return self.async_show_form(
            step_id="confirm_locality",
            data_schema=vol.Schema({}),
            description_placeholders={
                "locality": data["locality"],
                "station": data["station_name"],
                "distance": f"{data['distance_km']:.1f}",
                "reference": "la ubicación de HA"
                if data.get("location_source") == "home_assistant"
                else "el municipio",
                "origin": "geoEuskadi · Eusko Jaurlaritza / Gobierno Vasco"
                if data.get("location_source") == "home_assistant"
                else "Localidad elegida manualmente",
            },
        )

    async def async_step_station(self, user_input=None):
        entry = self.config_entry
        errors = {}
        api = EuskalmetAPI(
            session=async_get_clientsession(self.hass),
            email=entry.data["email"],
            private_key=entry.data["private_key"],
            time_zone=dt_util.get_default_time_zone(),
        )
        try:
            stations = rank_stations(
                await api.list_compatible_stations(),
                entry.data["latitude"],
                entry.data["longitude"],
            )
            if not stations:
                return self.async_abort(reason="no_nearby_station")
            if user_input:
                automatic = user_input["station_id"] == "automatic"
                selected = (
                    stations[0]
                    if automatic
                    else next(
                        (
                            s
                            for s in stations
                            if s["station_id"] == user_input["station_id"]
                        ),
                        None,
                    )
                )
                if selected is None:
                    errors["base"] = "station_not_available"
                else:
                    # Forecast region/zone/location remain tied to the town.
                    self.hass.config_entries.async_update_entry(
                        entry,
                        data={
                            **entry.data,
                            **selected,
                            "selection_mode": "automatic" if automatic else "manual",
                            "recommended_station": stations[0]["station_id"],
                        },
                    )
                    return self.async_create_entry(
                        title="", data={"station_id": user_input["station_id"]}
                    )
        except EuskalmetAuthenticationError:
            errors["base"] = "invalid_auth"
            stations = []
        except (EuskalmetAPIError, aiohttp.ClientError, TimeoutError):
            errors["base"] = "cannot_connect"
            stations = []
        options = [
            SelectOptionDict(
                value="automatic", label="Automática · más cercana a tu localidad"
            )
        ]
        options += [
            SelectOptionDict(
                value=s["station_id"],
                label=f"{s['station_name']} · {s['distance_km']:.1f} km",
            )
            for s in stations
        ]
        default = (
            "automatic"
            if entry.data.get("selection_mode") == "automatic"
            else entry.data["station_id"]
        )
        return self.async_show_form(
            step_id="station",
            errors=errors,
            data_schema=vol.Schema(
                {
                    vol.Required("station_id", default=default): SelectSelector(
                        SelectSelectorConfig(options=options)
                    )
                }
            ),
        )
