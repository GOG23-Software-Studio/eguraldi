"""Exercise the real HA config flow in CI, with mocked provider responses."""

import asyncio
from types import SimpleNamespace

import pytest

pytest.importorskip("homeassistant")

from homeassistant.core import HomeAssistant  # noqa: E402

from custom_components.euskalmet_local import config_flow  # noqa: E402


def test_real_ha_forms_and_locality_entry(tmp_path, monkeypatch):
    async def scenario():
        hass = HomeAssistant(str(tmp_path))
        flow = config_flow.EuskalmetConfigFlow()
        flow.hass = hass
        first = await flow.async_step_user()
        assert first["step_id"] == "user"
        flow._credentials = {
            "email": "demo@example.invalid",
            "private_key": "TEST_ONLY",
        }
        flow._places = [
            {
                "id": "3114866",
                "name": "Ortuella",
                "latitude": 43.31113,
                "longitude": -3.05617,
                "province": "Bizkaia",
            }
        ]
        flow._stations = [
            {
                "station_id": "C061",
                "station_name": "Arboleda",
                "station_latitude": 43.285,
                "station_longitude": -3.055,
                "available_measures": ["temperature", "humidity", "precipitation"],
                "missing_measures": ["pressure"],
            }
        ]

        async def regions():
            return [{"id": "48"}]

        async def zones(region):
            return [{"id": "01"}]

        async def locations(region, zone):
            return [{"id": "ORTUELLA", "name": "Ortuella"}]

        flow._api = SimpleNamespace(
            get_regions=regions, get_zones=zones, get_locations=locations
        )
        result = await flow.async_step_place({"place": "3114866"})
        assert result["step_id"] == "recommendation"
        assert flow._selected_station["station_id"] == "C061"

        async def unique_id(value):
            return None

        monkeypatch.setattr(flow, "async_set_unique_id", unique_id)
        monkeypatch.setattr(flow, "_abort_if_unique_id_configured", lambda: None)
        monkeypatch.setattr(flow, "async_create_entry", lambda **kwargs: kwargs)
        entry = await flow.async_step_recommendation({"station_id": "C061"})
        assert entry["data"]["locality"] == "Ortuella"
        assert entry["data"]["location"] == "ORTUELLA"
        assert entry["data"]["station_id"] == "C061"
        assert entry["data"]["selection_mode"] == "automatic"
        await hass.async_block_till_done()

    asyncio.run(scenario())


def test_weather_identity_uses_locality_and_preserves_station():
    from custom_components.euskalmet_local.weather import EuskalmetWeather

    coordinator = SimpleNamespace(
        config_entry_id="example_entry",
        locality="Ortuella",
        api=SimpleNamespace(station_id="C061", station_name="Arboleda"),
    )
    entity = EuskalmetWeather(coordinator)
    assert entity.unique_id == "example_entry_weather"
    assert entity.device_info["name"] == "Ortuella"
    assert entity.device_info["via_device"] == ("euskalmet_local", "C061")
    assert entity.name is None


def test_options_change_station_and_distance_without_changing_locality(monkeypatch):
    async def scenario():
        entry = SimpleNamespace(
            data={
                "email": "demo@example.invalid",
                "private_key": "TEST_ONLY",
                "locality": "Ortuella",
                "latitude": 43.31113,
                "longitude": -3.05617,
                "region": "basque_country",
                "zone": "cantabrian_valleys",
                "location": "ortuella",
                "station_id": "C061",
                "station_name": "Arboleda",
                "distance_km": 1.9,
            }
        )

        async def stations():
            return [
                {
                    "station_id": "C999",
                    "station_name": "Nueva estación",
                    "station_latitude": 43.35,
                    "station_longitude": -3.05,
                    "available_measures": ["temperature", "humidity", "precipitation"],
                }
            ]

        monkeypatch.setattr(
            config_flow,
            "EuskalmetAPI",
            lambda **kwargs: SimpleNamespace(list_compatible_stations=stations),
        )
        monkeypatch.setattr(config_flow, "async_get_clientsession", lambda hass: None)
        monkeypatch.setattr(
            config_flow.EuskalmetLocalOptionsFlow,
            "config_entry",
            property(lambda self: entry),
        )
        updates = []
        flow = config_flow.EuskalmetLocalOptionsFlow()
        flow.hass = SimpleNamespace(
            config_entries=SimpleNamespace(
                async_update_entry=lambda entry, **kwargs: updates.append(
                    kwargs["data"]
                )
            )
        )
        monkeypatch.setattr(flow, "async_create_entry", lambda **kwargs: kwargs)
        await flow.async_step_init({"station_id": "C999"})
        data = updates[-1]
        assert data["station_name"] == "Nueva estación"
        assert data["station_id"] == "C999"
        assert data["distance_km"] > 1.9
        assert data["locality"] == "Ortuella"
        assert data["location"] == "ortuella"
        assert data["latitude"] == entry.data["latitude"]
        assert data["selection_mode"] == "manual"
        await flow.async_step_init({"station_id": "automatic"})
        assert updates[-1]["selection_mode"] == "automatic"
        assert updates[-1]["locality"] == "Ortuella"

    asyncio.run(scenario())
