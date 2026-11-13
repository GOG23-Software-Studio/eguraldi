"""Selection tests run without Home Assistant or real credentials."""

import asyncio
import importlib.util
import sys
import types
from pathlib import Path

import pytest

ROOT = Path(__file__).parents[1] / "custom_components" / "euskalmet_local"
PACKAGE = "locality_test_package"
package = types.ModuleType(PACKAGE)
package.__path__ = [str(ROOT)]
sys.modules[PACKAGE] = package
spec = importlib.util.spec_from_file_location(
    f"{PACKAGE}.locality", ROOT / "locality.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def station(identifier, latitude, keys=("temperature", "humidity", "precipitation")):
    return {
        "station_id": identifier,
        "station_latitude": latitude,
        "station_longitude": -3.05,
        "available_measures": keys,
    }


def test_nearest_complete_station_wins():
    ranked = module.rank_stations(
        [station("far", 43.4), station("near", 43.31)], 43.3, -3.05
    )
    assert ranked[0]["station_id"] == "near"


def test_closest_station_wins_even_with_fewer_measures():
    ranked = module.rank_stations(
        [station("partial", 43.301, ("temperature",)), station("complete", 43.32)],
        43.3,
        -3.05,
    )
    assert ranked[0]["station_id"] == "partial"


def test_far_complete_station_does_not_beat_close_partial():
    assert (
        module.rank_stations(
            [station("partial", 43.3, ("temperature",)), station("far", 43.7)],
            43.3,
            -3.05,
        )[0]["station_id"]
        == "partial"
    )


def test_out_of_coverage_and_without_temperature_rejected():
    assert (
        module.rank_stations(
            [station("far", 40), station("rain", 43.3, ("precipitation",))], 43.3, -3.05
        )
        == []
    )


@pytest.mark.parametrize("latitude", [float("nan"), float("inf")])
def test_invalid_coordinates(latitude):
    with pytest.raises(ValueError):
        module.rank_stations([], latitude, 0)


def test_ranking_deterministic_on_tie():
    ranked = module.rank_stations([station("B", 43.3), station("A", 43.3)], 43.3, -3.05)
    assert [s["station_id"] for s in ranked] == ["A", "B"]


class FakeAPI:
    async def get_regions(self):
        return [{"id": "48"}]

    async def get_zones(self, region):
        return [{"id": "01"}]

    async def get_locations(self, region, zone):
        return [
            {"id": "ORTUELLA", "name": "Ortuella"},
            {"id": "TRAPAGARAN", "name": "Valle de Trápaga / Trapagaran"},
        ]


def test_forecast_uses_town_not_station():
    data = asyncio.run(
        module.resolve_forecast(
            FakeAPI(), {"name": "Ortuella", "province": "Bizkaia", "latitude": 43.3}
        )
    )
    assert data["location"] == "ORTUELLA"
    assert data["alert_zone"] == "BIZKAIA_INTERIOR"


def test_no_silent_fuzzy_forecast_fallback():
    with pytest.raises(ValueError):
        asyncio.run(
            module.resolve_forecast(
                FakeAPI(), {"name": "Ortue", "province": "Bizkaia", "latitude": 43.3}
            )
        )


def test_nearest_selection_uses_unrounded_distance():
    ranked = module.rank_stations(
        [
            station("near_partial", 43.30001, ("temperature",)),
            station("far_complete", 43.30002),
        ],
        43.3,
        -3.05,
    )
    assert ranked[0]["station_id"] == "near_partial"


def test_same_distance_prefers_more_complete_station():
    ranked = module.rank_stations(
        [station("partial", 43.31, ("temperature",)), station("complete", 43.31)],
        43.3,
        -3.05,
    )
    assert ranked[0]["station_id"] == "complete"
