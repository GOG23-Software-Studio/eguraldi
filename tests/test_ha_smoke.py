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
