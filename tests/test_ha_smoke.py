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
        hass.config_entries = SimpleNamespace(async_entries=lambda domain: [])
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
            options={},
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
            },
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


def options_locality_fixture(monkeypatch):
    entry = SimpleNamespace(
        options={},
        entry_id="stable-entry",
        unique_id="locality_1",
        title="Eguraldi · Ortuella",
        data={
            "email": "demo@example.invalid",
            "private_key": "TEST_ONLY",
            "locality": "Ortuella",
            "locality_id": "1",
            "latitude": 43.31113,
            "longitude": -3.05617,
            "region": "old-region",
            "zone": "old-zone",
            "location": "ortuella",
            "alert_zone": "old-alert",
            "station_id": "C061",
            "station_name": "Arboleda",
            "distance_km": 1.9,
            "selection_mode": "manual",
        },
    )
    place = {
        "id": "2",
        "name": "Bilbao",
        "latitude": 43.263,
        "longitude": -2.935,
        "province": "Bizkaia",
        "region_name": "Euskadi",
    }

    async def stations():
        return [
            {
                "station_id": "near",
                "station_name": "Más cercana",
                "station_latitude": 43.264,
                "station_longitude": -2.935,
                "available_measures": ["temperature"],
            },
            {
                "station_id": "complete",
                "station_name": "Otra estación",
                "station_latitude": 43.31,
                "station_longitude": -2.935,
                "available_measures": ["temperature", "humidity", "precipitation"],
            },
        ]

    async def search(session, query):
        return [place]

    async def forecast(api, selected):
        return {
            "region": "new-region",
            "zone": "new-zone",
            "location": "bilbao",
            "alert_zone": "new-alert",
        }

    monkeypatch.setattr(
        config_flow,
        "EuskalmetAPI",
        lambda **kwargs: SimpleNamespace(list_compatible_stations=stations),
    )
    monkeypatch.setattr(config_flow, "async_get_clientsession", lambda hass: None)
    monkeypatch.setattr(config_flow, "search_localities", search)
    monkeypatch.setattr(config_flow, "resolve_forecast", forecast)
    monkeypatch.setattr(
        config_flow.EuskalmetLocalOptionsFlow,
        "config_entry",
        property(lambda self: entry),
    )
    updates = []
    others = []

    def update(current, **kwargs):
        updates.append(kwargs)
        for key, value in kwargs.items():
            setattr(current, key, value)

    flow = config_flow.EuskalmetLocalOptionsFlow()
    flow.hass = SimpleNamespace(
        config_entries=SimpleNamespace(
            async_update_entry=update, async_entries=lambda domain: [entry, *others]
        )
    )
    monkeypatch.setattr(flow, "async_show_form", lambda **kwargs: kwargs)
    monkeypatch.setattr(flow, "async_create_entry", lambda **kwargs: kwargs)
    monkeypatch.setattr(flow, "async_abort", lambda **kwargs: kwargs)
    return flow, entry, updates, others


def test_locality_options_apply_once_keep_identity_and_allow_manual_station(
    monkeypatch,
):
    async def scenario():
        flow, entry, updates, _ = options_locality_fixture(monkeypatch)
        menu = await flow.async_step_init()
        assert menu["menu_options"] == [
            "home_assistant",
            "locality",
            "station",
            "microclimate",
            "laundry",
        ]
        result = await flow.async_step_locality({"locality": "Bilbao"})
        assert result["step_id"] == "place"
        result = await flow.async_step_place({"place": "2"})
        assert result["step_id"] == "confirm_locality"
        assert result["description_placeholders"]["station"] == "Más cercana"
        assert not updates and entry.data["locality"] == "Ortuella"
        await flow.async_step_confirm_locality({})
        assert len(updates) == 1
        assert entry.entry_id == "stable-entry" and entry.unique_id == "locality_2"
        assert entry.title == "Eguraldi · Bilbao"
        assert entry.data["locality"] == "Bilbao" and entry.data["location"] == "bilbao"
        assert (
            entry.data["zone"] == "new-zone" and entry.data["alert_zone"] == "new-alert"
        )
        assert (
            entry.data["station_id"] == "near"
            and entry.data["selection_mode"] == "automatic"
        )
        assert (
            entry.data["latitude"] == 43.263
            and entry.data["private_key"] == "TEST_ONLY"
        )
        await flow.async_step_station({"station_id": "complete"})
        assert (
            entry.data["selection_mode"] == "manual"
            and entry.data["station_id"] == "complete"
        )
        assert entry.data["locality"] == "Bilbao" and entry.data["location"] == "bilbao"
        await flow.async_step_station({"station_id": "automatic"})
        assert (
            entry.data["station_id"] == "near"
            and entry.data["selection_mode"] == "automatic"
        )

    asyncio.run(scenario())


def test_locality_options_reject_duplicates_without_changes(monkeypatch):
    async def scenario():
        flow, entry, updates, others = options_locality_fixture(monkeypatch)
        others.append(
            SimpleNamespace(entry_id="different-entry", unique_id="locality_2")
        )
        await flow.async_step_locality({"locality": "Bilbao"})
        result = await flow.async_step_place({"place": "2"})
        assert result["reason"] == "already_configured"
        assert not updates and entry.data["locality"] == "Ortuella"

    asyncio.run(scenario())


def test_locality_options_forecast_failure_keeps_old_configuration(monkeypatch):
    async def fail(api, place):
        raise config_flow.LocationDiscoveryError("not covered")

    async def scenario():
        flow, entry, updates, _ = options_locality_fixture(monkeypatch)
        monkeypatch.setattr(config_flow, "resolve_forecast", fail)
        await flow.async_step_locality({"locality": "Bilbao"})
        result = await flow.async_step_place({"place": "2"})
        assert result["errors"]["base"] == "forecast_locality_not_found"
        assert not updates and entry.data["locality"] == "Ortuella"

    asyncio.run(scenario())


def test_home_source_is_default_and_manual_locality_still_available(monkeypatch):
    async def scenario():
        flow = config_flow.EuskalmetConfigFlow()
        result = await flow.async_step_location_source()
        key = next(iter(result["data_schema"].schema))
        assert key.default() == "home_assistant"
        called = []

        async def home():
            called.append("home")
            return {"step_id": "recommendation"}

        async def manual():
            called.append("manual")
            return {"step_id": "locality"}

        monkeypatch.setattr(flow, "async_step_home_assistant", home)
        monkeypatch.setattr(flow, "async_step_locality", manual)
        await flow.async_step_location_source({"location_source": "home_assistant"})
        await flow.async_step_location_source({"location_source": "manual"})
        assert called == ["home", "manual"]

    asyncio.run(scenario())


def test_home_options_bind_current_entry_and_can_return_to_manual(monkeypatch):
    async def scenario():
        flow, entry, updates, _ = options_locality_fixture(monkeypatch)

        async def home(hass, api):
            return (
                {
                    "id": "home_assistant",
                    "name": "Ortuella",
                    "province": "Bizkaia",
                    "latitude": 43.31113,
                    "longitude": -3.05617,
                    "municipality_code": "48083",
                    "location_source": "home_assistant",
                },
                [
                    {
                        "station_id": "C061",
                        "station_name": "Arboleda",
                        "distance_km": 1.2,
                    }
                ],
                {
                    "region": "basque_country",
                    "zone": "cantabrian_valleys",
                    "location": "ortuella",
                    "alert_zone": "BIZKAIA_INTERIOR",
                },
            )

        monkeypatch.setattr(config_flow, "resolve_home", home)
        result = await flow.async_step_home_assistant()
        assert result["step_id"] == "confirm_locality" and not updates
        await flow.async_step_confirm_locality({})
        assert (
            entry.data["location_source"] == "home_assistant"
            and entry.unique_id == "locality_home_assistant"
        )
        assert entry.entry_id == "stable-entry"
        await flow.async_step_station({"station_id": "complete"})
        assert (
            entry.data["selection_mode"] == "manual"
            and entry.data["location_source"] == "home_assistant"
        )
        await flow.async_step_locality({"locality": "Bilbao"})
        await flow.async_step_place({"place": "2"})
        await flow.async_step_confirm_locality({})
        assert (
            entry.data["location_source"] == "manual"
            and entry.data["locality"] == "Bilbao"
        )

    asyncio.run(scenario())


def test_another_locality_reuses_credentials_only_on_the_server(monkeypatch):
    async def scenario():
        entry = SimpleNamespace(
            options={},
            entry_id="saved-account",
            title="Eguraldi · Ortuella",
            data={"email": "demo@example.invalid", "private_key": "TEST_ONLY"},
        )
        flow = config_flow.EuskalmetConfigFlow()
        flow.hass = SimpleNamespace(
            config_entries=SimpleNamespace(async_entries=lambda domain: [entry])
        )
        shown = await flow.async_step_account()
        assert "TEST_ONLY" not in str(shown)
        credentials = []

        async def use_saved(user_input=None):
            credentials.append(user_input)
            return {"step_id": "location_source"}

        monkeypatch.setattr(flow, "async_step_user", use_saved)
        result = await flow.async_step_account({"account": "saved-account"})
        assert result["step_id"] == "location_source"
        assert credentials == [entry.data]
        assert "TEST_ONLY" not in str(result)

    asyncio.run(scenario())


@pytest.mark.parametrize("source", ["home_assistant", "manual"])
def test_only_ha_bound_entries_follow_core_location_changes(monkeypatch, source):
    import custom_components.euskalmet_local as integration
    from custom_components.euskalmet_local import laundry

    async def noop(*args, **kwargs):
        return None

    async def scenario():
        callbacks = {}
        reloads = []
        constructed = []

        class Coordinator:
            def __init__(self, **kwargs):
                constructed.append(kwargs)
                self.api = SimpleNamespace(
                    station_id=kwargs["station_id"], station_name=kwargs["station_name"]
                )

            async def async_config_entry_first_refresh(self):
                pass

        def listen(event, callback):
            callbacks[event] = callback
            return lambda: None

        async def reload(entry_id):
            reloads.append(entry_id)

        monkeypatch.setattr(
            laundry,
            "LaundryCoordinator",
            lambda *args: SimpleNamespace(
                async_initialize=noop,
                async_refresh=noop,
                async_add_listener=lambda cb: lambda: None,
            ),
        )
        monkeypatch.setattr(integration, "_async_register_frontend", noop)
        monkeypatch.setattr(integration, "EuskalmetCoordinator", Coordinator)
        monkeypatch.setattr(
            integration.dr,
            "async_get",
            lambda hass: SimpleNamespace(
                async_get_or_create=lambda **kwargs: SimpleNamespace(id="device")
            ),
        )
        entry = SimpleNamespace(
            options={},
            entry_id="stable",
            data={
                "email": "demo@example.invalid",
                "private_key": "TEST_ONLY",
                "location_source": source,
                "latitude": 43.3,
                "longitude": -3.05,
                "station_id": "manual-station",
                "station_name": "Manual",
                "selection_mode": "manual",
            },
            async_on_unload=lambda callback: None,
            add_update_listener=lambda callback: lambda: None,
        )
        hass = SimpleNamespace(
            config=SimpleNamespace(latitude=43.3, longitude=-3.05),
            data={"euskalmet_local": {}},
            config_entries=SimpleNamespace(
                async_forward_entry_setups=noop, async_reload=reload
            ),
            bus=SimpleNamespace(async_listen=listen, async_fire=lambda *args: None),
        )
        await integration.async_setup_entry(hass, entry)
        assert constructed[0]["station_id"] == "manual-station"
        if source == "manual":
            assert not callbacks
        else:
            callback = callbacks[integration.EVENT_CORE_CONFIG_UPDATE]
            await callback(None)
            assert not reloads
            hass.config.latitude = 43.4
            await callback(None)
            assert reloads == ["stable"]

    asyncio.run(scenario())


def test_microclimate_options_require_real_outdoor_sensor_and_preserve_settings(
    monkeypatch,
):
    from homeassistant.helpers import entity_registry as er

    async def scenario():
        flow, entry, _, _ = options_locality_fixture(monkeypatch)
        entry.options = {"station_id": "automatic"}
        flow.hass.states = {
            "sensor.outdoor": SimpleNamespace(
                attributes={
                    "device_class": "temperature",
                    "state_class": "measurement",
                    "unit_of_measurement": "°C",
                }
            ),
            "sensor.humidity": SimpleNamespace(attributes={"device_class": "humidity"}),
        }
        monkeypatch.setattr(
            er, "async_get", lambda hass: SimpleNamespace(async_get=lambda id: None)
        )
        form = await flow.async_step_microclimate()
        assert form["step_id"] == "microclimate"
        invalid = await flow.async_step_microclimate(
            {"microclimate_enabled": True, "microclimate_sensor": "sensor.humidity"}
        )
        assert "microclimate_sensor" in invalid["errors"]
        assert "microclimate_outdoors_confirmed" in invalid["errors"]
        result = await flow.async_step_microclimate(
            {
                "microclimate_enabled": True,
                "microclimate_sensor": "sensor.outdoor",
                "microclimate_outdoors_confirmed": True,
            }
        )
        assert result["data"]["station_id"] == "automatic"
        assert result["data"]["microclimate_since"]
        entry.options = result["data"]
        old_since = entry.options["microclimate_since"]
        same = await flow.async_step_microclimate(
            {
                "microclimate_enabled": True,
                "microclimate_sensor": "sensor.outdoor",
                "microclimate_outdoors_confirmed": True,
            }
        )
        assert same["data"]["microclimate_since"] == old_since
        station = await flow.async_step_station({"station_id": "automatic"})
        assert station["data"]["microclimate_sensor"] == "sensor.outdoor"
        assert station["data"]["microclimate_enabled"]

    asyncio.run(scenario())


def test_microclimate_units_freshness_and_validation_gate(tmp_path, monkeypatch):
    from datetime import timedelta

    from homeassistant.helpers import entity_registry as er
    from homeassistant.util import dt as dt_util

    from custom_components.euskalmet_local.microclimate import (
        MicroclimateCoordinator,
        MicroclimateSensor,
    )

    async def scenario():
        hass = HomeAssistant(str(tmp_path))
        entry = SimpleNamespace(
            entry_id="micro-test",
            options={"microclimate_sensor": "sensor.outdoor"},
            data={"latitude": 43.3, "longitude": -3, "locality": "Ortuella"},
            async_on_unload=lambda callback: None,
        )
        monkeypatch.setattr(
            er,
            "async_get",
            lambda hass: SimpleNamespace(
                async_get_entity_id=lambda *args: "sensor.reference"
            ),
        )
        micro = MicroclimateCoordinator(hass, entry)
        now = dt_util.utcnow()
        hass.states.async_set(
            "sensor.reference",
            "18",
            {"unit_of_measurement": "°C", "observed_at": now.isoformat()},
        )
        hass.states.async_set("sensor.outdoor", "68", {"unit_of_measurement": "°F"})
        micro.data = {
            "status": "learning",
            "hourly": [{"hour": dt_util.now().hour, "correction": 2}],
            "last_pair": now.isoformat(),
        }
        values = micro.live_values()
        assert values["outdoor_temperature"] == 20
        assert values["current_difference"] == 2
        assert values["estimate"] is None
        micro.data["status"] = "validated"
        assert micro.live_values()["estimate"] == 20
        assert MicroclimateSensor(micro, "estimate").device_class == "temperature"
        assert MicroclimateSensor(micro, "bias").device_class is None
        hass.states.async_set(
            "sensor.reference",
            "18",
            {
                "unit_of_measurement": "°C",
                "observed_at": (now - timedelta(hours=2)).isoformat(),
            },
        )
        assert micro.live_values()["estimate"] is None
        assert micro.live_values()["current_difference"] is None
        await micro.async_shutdown()
        await hass.async_block_till_done()

    asyncio.run(scenario())


def test_microclimate_source_binding_survives_restart_and_resets_on_station_change(
    tmp_path, monkeypatch
):
    from datetime import timedelta

    from homeassistant.util import dt as dt_util

    from custom_components.euskalmet_local.microclimate import MicroclimateCoordinator
    from custom_components.euskalmet_local.microclimate_model import source_key

    async def scenario():
        hass = HomeAssistant(str(tmp_path))
        data = {
            "station_id": "C061",
            "locality_id": "1",
            "latitude": 43.3,
            "longitude": -3,
        }
        since = dt_util.utcnow() - timedelta(days=4)
        key = source_key(data, "sensor.outdoor")
        stored = {"source": key, "since": since.isoformat()}

        class Storage:
            async def async_load(self):
                return stored.copy()

            async def async_save(self, value):
                stored.update(value)

        entry = SimpleNamespace(
            entry_id="micro-test",
            options={
                "microclimate_sensor": "sensor.outdoor",
                "microclimate_source": key,
                "microclimate_since": since.isoformat(),
            },
            data=data,
            async_on_unload=lambda callback: None,
        )
        micro = MicroclimateCoordinator(hass, entry)
        micro.store = Storage()
        await micro.async_initialize()
        assert micro.since == since
        entry.data = {**data, "station_id": "OTHER"}
        await micro.async_initialize()
        assert micro.since > since + timedelta(days=3)
        entry.data = data
        await micro.async_initialize()
        assert micro.since > since + timedelta(days=3)
        new_since = micro.since
        await micro.async_initialize()
        assert micro.since == new_since
        await micro.async_shutdown()
        await hass.async_block_till_done()

    asyncio.run(scenario())


def test_microclimate_recorder_query_is_local_hourly_and_normalized(
    tmp_path, monkeypatch
):
    from datetime import timedelta

    from homeassistant.helpers import entity_registry as er
    from homeassistant.helpers import recorder
    from homeassistant.util import dt as dt_util

    from custom_components.euskalmet_local.microclimate import MicroclimateCoordinator

    async def scenario():
        hass = HomeAssistant(str(tmp_path))
        entry = SimpleNamespace(
            entry_id="micro-test",
            options={"microclimate_sensor": "sensor.outdoor"},
            data={"latitude": 43.3, "longitude": -3},
            async_on_unload=lambda callback: None,
        )
        monkeypatch.setattr(
            er,
            "async_get",
            lambda hass: SimpleNamespace(
                async_get_entity_id=lambda *args: "sensor.reference"
            ),
        )
        now = dt_util.utcnow()
        end = int(now.timestamp() // 3600 * 3600)
        calls = []

        class Recorder:
            async def async_add_executor_job(self, function, *args):
                calls.append(args)
                return {
                    "sensor.reference": [
                        {"start": end - 7200, "mean": 10},
                        {"start": end - 3600, "mean": 11},
                    ],
                    "sensor.outdoor": [
                        {"start": end - 7200, "mean": 12},
                        {"start": end - 3600, "mean": 13},
                    ],
                }

        monkeypatch.setattr(recorder, "get_instance", lambda hass: Recorder())
        hass.states.async_set("sensor.outdoor", "13", {"friendly_name": "Outdoor"})
        micro = MicroclimateCoordinator(hass, entry)
        micro.since = now - timedelta(days=2)
        result = await micro._async_update_data()
        assert result["status"] == "learning" and result["paired_hours"] == 2
        assert result["summary"]["bias"] == 2
        assert calls[0][-3:] == ("hour", {"temperature": "°C"}, {"mean"})
        assert calls[0][-4] == {"sensor.reference", "sensor.outdoor"}
        await micro.async_shutdown()
        await hass.async_block_till_done()

    asyncio.run(scenario())


def test_microclimate_admin_action_uses_wizard_validation(tmp_path, monkeypatch):
    from homeassistant.exceptions import HomeAssistantError
    from homeassistant.helpers import entity_registry as er

    from custom_components.euskalmet_local.microclimate_options import (
        async_register_microclimate_service,
    )

    async def scenario():
        hass = HomeAssistant(str(tmp_path))
        updates = []
        entry = SimpleNamespace(
            domain="euskalmet_local",
            data={"station_id": "C061"},
            options={"station_id": "automatic"},
        )
        hass.config_entries = SimpleNamespace(
            async_get_entry=lambda id: entry if id == "ours" else None,
            async_update_entry=lambda e, **kw: updates.append(kw),
        )
        monkeypatch.setattr(
            er, "async_get", lambda hass: SimpleNamespace(async_get=lambda id: None)
        )
        hass.states.async_set(
            "sensor.outdoor",
            "15",
            {
                "device_class": "temperature",
                "state_class": "measurement",
                "unit_of_measurement": "°C",
            },
        )
        async_register_microclimate_service(hass)
        payload = {
            "entry_id": "ours",
            "microclimate_enabled": True,
            "microclimate_sensor": "sensor.outdoor",
            "microclimate_outdoors_confirmed": False,
        }
        with pytest.raises(HomeAssistantError):
            await hass.services.async_call(
                "euskalmet_local", "configure_microclimate", payload, blocking=True
            )
        assert not updates
        payload["microclimate_outdoors_confirmed"] = True
        await hass.services.async_call(
            "euskalmet_local", "configure_microclimate", payload, blocking=True
        )
        assert updates[0]["options"]["station_id"] == "automatic"
        assert updates[0]["options"]["microclimate_enabled"]
        payload["entry_id"] = "other"
        with pytest.raises(HomeAssistantError):
            await hass.services.async_call(
                "euskalmet_local", "configure_microclimate", payload, blocking=True
            )
        await hass.async_block_till_done()

    asyncio.run(scenario())


def test_laundry_options_validate_destination_and_preserve_microclimate(
    tmp_path, monkeypatch
):
    async def scenario():
        hass = HomeAssistant(str(tmp_path))
        flow, entry, _, _ = options_locality_fixture(monkeypatch)
        flow.hass = hass
        entry.options = {"microclimate_enabled": True, "microclimate_since": "keep"}
        form = await flow.async_step_laundry()
        defaults = form["data_schema"]({})
        assert defaults["laundry_enabled"] is False
        invalid = await flow.async_step_laundry({**defaults, "laundry_enabled": True})
        assert invalid["errors"] == {"laundry_target": "laundry_target_required"}
        saved = await flow.async_step_laundry(
            {
                **defaults,
                "laundry_enabled": True,
                "laundry_target": "persistent_notification",
            }
        )
        assert saved["data"]["microclimate_since"] == "keep"
        assert saved["data"]["laundry_lead_minutes"] == 30
        invalid = await flow.async_step_laundry(
            {
                **defaults,
                "laundry_enabled": True,
                "laundry_target": "persistent_notification",
                "laundry_rain": False,
                "laundry_wind": False,
            }
        )
        assert invalid["errors"]["base"] == "laundry_event_required"
        await hass.async_block_till_done()

    asyncio.run(scenario())


def test_laundry_mock_delivery_persistence_and_isolation(tmp_path, monkeypatch):
    from datetime import UTC, datetime, timedelta

    from homeassistant.util import dt as dt_util

    from custom_components.euskalmet_local.laundry import (
        LaundryCoordinator,
        destinations,
    )
    from custom_components.euskalmet_local.laundry_model import DEFAULTS
    from custom_components.euskalmet_local.switch import LaundrySwitch

    async def scenario():
        hass = HomeAssistant(str(tmp_path))
        now = datetime(2026, 11, 18, 10, 40, tzinfo=UTC)
        monkeypatch.setattr(dt_util, "utcnow", lambda: now)
        calls = []

        async def notify(call):
            calls.append((call.domain, call.service, call.data))

        hass.services.async_register("notify", "phone_test", notify)
        hass.services.async_register("notify", "notify", notify)
        hass.services.async_register("notify", "send_message", notify)
        hass.services.async_register("persistent_notification", "create", notify)
        hass.states.async_set("notify.test_entity", "unknown")
        assert "service:notify" not in destinations(hass)
        assert "service:send_message" not in destinations(hass)
        provider = SimpleNamespace(
            hourly_forecast_updated=now,
            data={
                "forecast_hourly": {
                    "at": now.isoformat(),
                    "for": now.isoformat(),
                    "trends": {
                        "set": [
                            {
                                "range": "[11:00..12:00)",
                                "precipitation": {"value": 1},
                                "windspeed": {"value": 0},
                            }
                        ]
                    },
                }
            },
        )

        def entry(id="laundry-a", **options):
            return SimpleNamespace(
                entry_id=id,
                title="Demo",
                data={"locality": "Demo", "locality_id": id, "station_id": "TEST"},
                options={**DEFAULTS, **options},
                runtime_data=provider,
                async_on_unload=lambda cb: None,
            )

        disabled = LaundryCoordinator(hass, entry())
        await disabled.async_initialize()
        await disabled.async_set_active(True)
        assert not disabled.active and not calls and disabled.status == "disabled"
        enabled_entry = entry(laundry_enabled=True, laundry_target="service:phone_test")
        monitor = LaundryCoordinator(hass, enabled_entry)
        await monitor.async_initialize()
        assert not monitor.active
        await monitor.async_set_active(True)
        assert len(calls) == 1 and calls[0][:2] == ("notify", "phone_test")
        assert calls[0][2]["title"] == "Eguraldi · Demo"
        assert calls[0][2]["message"] == (
            "Se espera lluvia próximamente en Demo. "
            "Si tienes ropa tendida, conviene recogerla."
        )
        await monitor.async_set_active(True)
        await monitor.async_refresh()
        assert len(calls) == 1
        switch = LaundrySwitch(monitor)
        assert switch.is_on and switch.extra_state_attributes["alerts_enabled"]
        assert "target" not in switch.extra_state_attributes
        restarted = LaundryCoordinator(hass, enabled_entry)
        await restarted.async_initialize()
        assert restarted.active
        await restarted.async_refresh()
        assert len(calls) == 1
        await restarted.async_set_active(False)
        await restarted.async_set_active(True)
        assert len(calls) == 1 and restarted.status == "cooldown"
        other = LaundryCoordinator(
            hass,
            entry(
                "laundry-b",
                laundry_enabled=True,
                laundry_target="entity:notify.test_entity",
            ),
        )
        await other.async_initialize()
        assert not other.active
        await other.async_set_active(True)
        assert len(calls) == 2 and calls[-1][2]["entity_id"] == "notify.test_entity"
        enabled_entry.data["locality_id"] = "changed"
        changed = LaundryCoordinator(hass, enabled_entry)
        await changed.async_initialize()
        assert not changed.active
        now += timedelta(hours=25)
        await other.async_refresh()
        assert not other.active
        for controller in (disabled, monitor, restarted, other, changed):
            await controller.async_shutdown()
        await hass.async_block_till_done()

    asyncio.run(scenario())


def test_laundry_quiet_stale_failed_and_persistent_targets(tmp_path, monkeypatch):
    from datetime import UTC, datetime, timedelta

    from homeassistant.util import dt as dt_util

    from custom_components.euskalmet_local.laundry import LaundryCoordinator
    from custom_components.euskalmet_local.laundry_model import DEFAULTS

    async def scenario():
        hass = HomeAssistant(str(tmp_path))
        now = datetime(2026, 11, 18, 10, 40, tzinfo=UTC)
        monkeypatch.setattr(dt_util, "utcnow", lambda: now)
        calls = []

        async def failing(call):
            calls.append(call)
            raise RuntimeError("mock delivery failure")

        hass.services.async_register("persistent_notification", "create", failing)
        provider = SimpleNamespace(
            hourly_forecast_updated=now,
            data={
                "forecast_hourly": {
                    "at": now.isoformat(),
                    "for": now.isoformat(),
                    "trends": {
                        "set": [
                            {"range": "[10:00..11:00)", "precipitation": {"value": 1}}
                        ]
                    },
                }
            },
        )
        entry = SimpleNamespace(
            entry_id="laundry-errors",
            title="Demo",
            data={},
            runtime_data=provider,
            options={
                **DEFAULTS,
                "laundry_enabled": True,
                "laundry_target": "persistent_notification",
                "laundry_start": "00:00:00",
                "laundry_end": "00:00:00",
            },
            async_on_unload=lambda cb: None,
        )
        monitor = LaundryCoordinator(hass, entry)
        await monitor.async_initialize()
        monitor.options["laundry_start"] = "22:00:00"
        monitor.options["laundry_end"] = "23:00:00"
        await monitor.async_set_active(True)
        assert monitor.status == "quiet_hours" and not calls
        monitor.options.update(laundry_start="00:00:00", laundry_end="00:00:00")
        provider.hourly_forecast_updated = now - timedelta(hours=3)
        await monitor.async_refresh()
        assert monitor.status == "no_forecast" and not calls
        provider.hourly_forecast_updated = now
        monitor.options["laundry_target"] = "service:missing"
        await monitor.async_refresh()
        assert monitor.status == "target_unavailable" and not calls
        monitor.options["laundry_target"] = "persistent_notification"
        await monitor.async_refresh()
        assert monitor.status == "delivery_failed" and len(calls) == 1
        await monitor.async_refresh()
        assert monitor.status == "delivery_failed" and len(calls) == 1
        assert calls[0].data["notification_id"].endswith(entry.entry_id)
        await monitor.async_shutdown()
        await hass.async_block_till_done()

    asyncio.run(scenario())


def test_forecast_cache_expires_and_standard_weather_recovers(tmp_path, monkeypatch):
    from datetime import UTC, datetime, timedelta

    from homeassistant.util import dt as dt_util

    from custom_components.euskalmet_local.weather import EuskalmetWeather

    async def scenario():
        now = datetime(2026, 11, 20, 12, tzinfo=UTC)
        monkeypatch.setattr(dt_util, "utcnow", lambda: now)
        source = SimpleNamespace(
            config_entry_id="demo",
            locality="Demo",
            hourly_forecast_updated=now,
            daily_forecast_updated=now,
            data={
                "forecast_daily": [
                    {
                        "date": "2026-11-21",
                        "weather": {"id": "00"},
                        "temperatureRange": {"min": 8, "max": 16},
                    }
                ],
                "forecast_hourly": {
                    "at": now.isoformat(),
                    "for": now.isoformat(),
                    "trends": {
                        "set": [
                            {"range": "[13:00..14:00)", "temperature": {"value": 16}}
                        ]
                    },
                },
            },
            api=SimpleNamespace(location="demo", region="test", zone="test"),
        )
        weather = EuskalmetWeather(source)
        weather.hass = HomeAssistant(str(tmp_path))
        assert len(await weather.async_forecast_daily()) == 1
        source.daily_forecast_updated = now - timedelta(hours=7)
        assert await weather.async_forecast_daily() == []
        assert weather.extra_state_attributes["forecast_daily_stale"] is True
        source.hourly_forecast_updated = now - timedelta(hours=3)
        assert await weather.async_forecast_hourly() == []
        assert weather.extra_state_attributes["forecast_hourly_stale"] is True
        assert source.data["forecast_daily"]  # Internal cache kept for diagnosis.
        source.daily_forecast_updated = now
        assert len(await weather.async_forecast_daily()) == 1
        assert weather.extra_state_attributes["forecast_daily_stale"] is False

    asyncio.run(scenario())


def test_optional_authentication_is_not_silently_cached():
    from homeassistant.exceptions import ConfigEntryAuthFailed

    from custom_components.euskalmet_local.api import EuskalmetAuthenticationError
    from custom_components.euskalmet_local.coordinator import EuskalmetCoordinator

    source = EuskalmetCoordinator.__new__(EuskalmetCoordinator)
    source._failed_endpoints = set()
    source.data = {"forecast_daily": [{"date": "cached"}]}
    with pytest.raises(ConfigEntryAuthFailed):
        source._optional_result(
            "forecast_daily", EuskalmetAuthenticationError("401"), []
        )
    assert not source._failed_endpoints


def test_hourly_api_preserves_authentication_and_cancellation(monkeypatch):
    from unittest.mock import AsyncMock

    from custom_components.euskalmet_local.api import (
        EuskalmetAPI,
        EuskalmetAuthenticationError,
    )

    async def scenario():
        source = EuskalmetAPI(
            session=None, email="test@example.invalid", private_key="TEST_ONLY"
        )
        for exception in (
            EuskalmetAuthenticationError("401"),
            asyncio.CancelledError(),
        ):
            source._request = AsyncMock(side_effect=exception)
            with pytest.raises(type(exception)):
                await source.get_hourly_forecast()

    asyncio.run(scenario())


def test_coordinator_shutdown_cancels_refresh_before_closing_api(tmp_path, monkeypatch):
    from unittest.mock import AsyncMock

    from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

    from custom_components.euskalmet_local.coordinator import EuskalmetCoordinator

    async def scenario():
        hass = HomeAssistant(str(tmp_path))
        source = EuskalmetCoordinator.__new__(EuskalmetCoordinator)
        DataUpdateCoordinator.__init__(
            source,
            hass,
            __import__("logging").getLogger(__name__),
            name="test",
            config_entry=None,
        )
        source.api = SimpleNamespace(close=AsyncMock())
        unsub = __import__("unittest.mock", fromlist=["Mock"]).Mock()
        source._unsub_refresh = unsub
        await source.async_shutdown()
        assert source._shutdown_requested
        unsub.assert_called_once()
        source.api.close.assert_awaited_once()
        await hass.async_block_till_done()

    asyncio.run(scenario())


def test_diagnostics_report_freshness_without_locations_or_recipients():
    import json

    from custom_components.euskalmet_local.diagnostics import (
        async_get_config_entry_diagnostics,
    )

    async def scenario():
        entry = SimpleNamespace(
            version=2,
            data={
                "email": "PRIVATE_EMAIL",
                "private_key": "PRIVATE_KEY",
                "locality": "PRIVATE_TOWN",
                "station_name": "PRIVATE_STATION",
                "latitude": 43.123456,
                "station_longitude": -3.987654,
            },
            options={
                "laundry_target": "PRIVATE_PHONE",
                "microclimate_sensor": "sensor.PRIVATE_SENSOR",
            },
            runtime_data=SimpleNamespace(
                data={}, last_update_success=False, _failed_endpoints={"forecast_daily"}
            ),
        )
        result = await async_get_config_entry_diagnostics(None, entry)
        encoded = json.dumps(result)
        for secret in (
            "PRIVATE_EMAIL",
            "PRIVATE_KEY",
            "PRIVATE_TOWN",
            "PRIVATE_STATION",
            "PRIVATE_PHONE",
            "PRIVATE_SENSOR",
            "43.123456",
            "-3.987654",
        ):
            assert secret not in encoded
        assert result["forecasts"]["daily"]["stale"] is True
        assert result["failed_endpoints"] == ["forecast_daily"]

    asyncio.run(scenario())


def test_successful_observations_never_refresh_failed_forecast_age(
    tmp_path, monkeypatch
):
    from datetime import UTC, datetime, timedelta
    from unittest.mock import AsyncMock

    import custom_components.euskalmet_local.coordinator as module
    from custom_components.euskalmet_local.api import EuskalmetAPIError
    from custom_components.euskalmet_local.forecast_quality import forecast_is_fresh

    async def scenario():
        now = datetime(2026, 11, 20, 12, tzinfo=UTC)
        first = now

        class Clock(datetime):
            @classmethod
            def now(cls, tz=None):
                return now if tz else now.replace(tzinfo=None)

        monkeypatch.setattr(module, "datetime", Clock)
        api = SimpleNamespace(
            time_zone=UTC,
            close=AsyncMock(),
            _empty_alerts=lambda: {},
            _empty_radar=lambda: {},
        )
        for method in (
            "get_all_measurements",
            "get_aggregated_day_summary",
            "get_aggregated_month_summary",
            "get_alerts",
            "get_ocean_forecast",
            "get_tides",
            "get_radar_report",
            "get_pollen_measurements",
            "get_astro_calendar",
        ):
            setattr(api, method, AsyncMock(return_value={}))
        api.get_daily_forecast = AsyncMock(return_value=[{"date": "2026-11-21"}])
        api.get_hourly_forecast = AsyncMock(
            return_value={"at": now.isoformat(), "trends": {"set": [{}]}}
        )
        monkeypatch.setattr(module, "EuskalmetAPI", lambda **kwargs: api)
        monkeypatch.setattr(module, "async_get_clientsession", lambda hass: None)
        hass = HomeAssistant(str(tmp_path))
        entry = SimpleNamespace(
            data={"locality": "Demo"}, async_on_unload=lambda cb: None
        )
        source = module.EuskalmetCoordinator(
            hass,
            entry,
            "demo@example.invalid",
            "TEST_ONLY",
            "r",
            "z",
            "demo",
            "TEST",
            "Demo",
            "TEST",
            43.3,
            -3.0,
        )
        source.data = await source._async_update_data()
        assert source.hourly_forecast_updated == first
        assert source.daily_forecast_updated == first
        api.get_daily_forecast.side_effect = EuskalmetAPIError("offline")
        api.get_hourly_forecast.side_effect = EuskalmetAPIError("offline")
        api.get_all_measurements.return_value = {"temperature": {"value": 19}}
        now += timedelta(hours=7)
        source.data = await source._async_update_data()
        assert source.data["current"]["temperature"]["value"] == 19
        assert source.hourly_forecast_updated == first
        assert source.daily_forecast_updated == first
        assert not forecast_is_fresh(source, "hourly", now)
        assert not forecast_is_fresh(source, "daily", now)
        assert {"forecast_daily", "forecast_hourly"} <= source._failed_endpoints
        api.get_daily_forecast.side_effect = None
        api.get_hourly_forecast.side_effect = None
        now += timedelta(hours=2)
        api.get_hourly_forecast.return_value = {
            "at": now.isoformat(),
            "trends": {"set": [{}]},
        }
        source.data = await source._async_update_data()
        assert forecast_is_fresh(source, "hourly", now)
        assert forecast_is_fresh(source, "daily", now)
        assert not {"forecast_daily", "forecast_hourly"} & source._failed_endpoints
        await source.async_shutdown()
        await hass.async_block_till_done()

    asyncio.run(scenario())


def test_reauthentication_keeps_identity_location_options_and_training(
    tmp_path, monkeypatch
):
    from custom_components.euskalmet_local.api import EuskalmetAuthenticationError

    async def scenario():
        hass = HomeAssistant(str(tmp_path))
        entry = SimpleNamespace(
            entry_id="stable",
            data={
                "email": "old@example.invalid",
                "private_key": "OLD",
                "locality": "Demo",
                "station_id": "TEST",
            },
            options={"microclimate_since": "KEEP", "laundry_enabled": False},
        )
        flow = config_flow.EuskalmetConfigFlow()
        flow.hass = hass
        updates = []
        monkeypatch.setattr(flow, "_get_reauth_entry", lambda: entry)
        monkeypatch.setattr(flow, "async_show_form", lambda **kwargs: kwargs)
        monkeypatch.setattr(
            flow,
            "async_update_reload_and_abort",
            lambda e, **kwargs: (
                updates.append((e, kwargs))
                or {"type": "abort", "reason": "reauth_successful"}
            ),
        )
        monkeypatch.setattr(config_flow, "_is_valid_private_key", lambda value: True)
        monkeypatch.setattr(config_flow, "async_get_clientsession", lambda hass: None)
        rejected = True

        async def regions():
            if rejected:
                raise EuskalmetAuthenticationError("401")
            return []

        monkeypatch.setattr(
            config_flow,
            "EuskalmetAPI",
            lambda **kwargs: SimpleNamespace(get_regions=regions),
        )
        result = await flow.async_step_reauth_confirm(
            {"email": "new@example.invalid", "private_key": "TEST_ONLY"}
        )
        assert result["errors"]["base"] == "invalid_auth"
        assert not updates and entry.data["private_key"] == "OLD"
        rejected = False
        result = await flow.async_step_reauth_confirm(
            {"email": "new@example.invalid", "private_key": "TEST_ONLY"}
        )
        assert result["reason"] == "reauth_successful"
        assert updates[0][0] is entry
        assert set(updates[0][1]["data_updates"]) == {"email", "private_key"}
        assert entry.options["microclimate_since"] == "KEEP"
        assert entry.data["locality"] == "Demo"
        await hass.async_block_till_done()

    asyncio.run(scenario())


def test_summary_alerts_distinguish_empty_success_from_partial_or_invalid_downloads():
    from unittest.mock import AsyncMock

    from custom_components.euskalmet_local.api import EuskalmetAPI, EuskalmetAPIError

    async def scenario():
        api = EuskalmetAPI(
            session=None, email="test@example.invalid", private_key="TEST_ONLY"
        )
        api._request = AsyncMock(return_value=[])
        empty = await api.get_alerts()
        assert empty["complete"] is True and empty["active"] is False
        api._request = AsyncMock(return_value={})
        assert (await api.get_alerts())["complete"] is False
        api._request = AsyncMock(
            side_effect=[
                [{"key": "a"}, {"key": "b"}],
                {"severity": "YELLOW", "items": []},
                EuskalmetAPIError("offline"),
            ]
        )
        partial = await api.get_alerts()
        assert partial["complete"] is False
        api._request = AsyncMock(
            side_effect=[[{"key": "a"}], {"severity": "UNEXPECTED", "items": []}]
        )
        assert (await api.get_alerts())["complete"] is False

    asyncio.run(scenario())


def test_summary_alert_freshness_marks_recent_failed_or_incomplete_checks(
    tmp_path, monkeypatch
):
    from datetime import UTC, datetime, timedelta

    from homeassistant.util import dt as dt_util

    from custom_components.euskalmet_local.weather import EuskalmetWeather

    async def scenario():
        now = datetime(2026, 11, 20, 12, tzinfo=UTC)
        monkeypatch.setattr(dt_util, "utcnow", lambda: now)
        source = SimpleNamespace(
            config_entry_id="demo",
            data={"alerts": {"complete": True}},
            alerts_updated=now,
            _failed_endpoints=set(),
            api=SimpleNamespace(location="demo", region="r", zone="z"),
        )
        weather = EuskalmetWeather(source)
        weather.hass = HomeAssistant(str(tmp_path))
        assert weather.extra_state_attributes["alerts_stale"] is False
        source._failed_endpoints.add("alerts")
        assert weather.extra_state_attributes["alerts_stale"] is True
        source._failed_endpoints.clear()
        source.data["alerts"]["complete"] = False
        assert weather.extra_state_attributes["alerts_stale"] is True
        source.data["alerts"]["complete"] = True
        source.alerts_updated = now - timedelta(minutes=46)
        assert weather.extra_state_attributes["alerts_stale"] is True

    asyncio.run(scenario())


def test_standard_alert_entities_become_unavailable_when_checks_expire(monkeypatch):
    from datetime import UTC, datetime, timedelta

    from homeassistant.util import dt as dt_util

    from custom_components.euskalmet_local.binary_sensor import (
        EuskalmetAlertBinarySensor,
    )
    from custom_components.euskalmet_local.sensor import EuskalmetAlertLevelSensor

    now = datetime(2026, 11, 20, 12, tzinfo=UTC)
    monkeypatch.setattr(dt_util, "utcnow", lambda: now)
    source = SimpleNamespace(
        config_entry_id="demo",
        data={"alerts": {"complete": True, "severity": "NONE"}},
        alerts_updated=now,
        last_update_success=True,
        _failed_endpoints=set(),
    )
    entities = [EuskalmetAlertLevelSensor(source), EuskalmetAlertBinarySensor(source)]
    assert all(entity.available for entity in entities)
    source.alerts_updated = now - timedelta(minutes=46)
    assert not any(entity.available for entity in entities)
    source.alerts_updated = now
    source._failed_endpoints.add("alerts")
    assert not any(entity.available for entity in entities)
    source._failed_endpoints.clear()
    assert all(entity.available for entity in entities)
