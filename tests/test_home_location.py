"""Local municipality lookup with public town-centre coordinates, never HA data."""

import importlib.util
import sys
import types
from pathlib import Path

import pytest

ROOT = Path(__file__).parents[1] / "custom_components" / "euskalmet_local"
PACKAGE = "home_location_test_package"
package = types.ModuleType(PACKAGE)
package.__path__ = [str(ROOT)]
sys.modules[PACKAGE] = package
spec = importlib.util.spec_from_file_location(
    f"{PACKAGE}.home_location", ROOT / "home_location.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


@pytest.mark.parametrize(
    "latitude,longitude,name",
    [
        (43.31113, -3.05617, "Ortuella"),
        (43.26271, -2.92528, "Bilbao"),
        (42.8467, -2.6716, "Vitoria-Gasteiz"),
    ],
)
def test_municipality_is_identified_without_network(latitude, longitude, name):
    place = module.home_place(latitude, longitude)
    assert name in place["aliases"]
    assert place["id"] == "home_assistant"
    assert place["latitude"] == latitude and place["longitude"] == longitude
    assert place["location_source"] == "home_assistant"


@pytest.mark.parametrize(
    "latitude,longitude", [(40, -3), (float("nan"), 0), (0, float("inf")), (91, 0)]
)
def test_invalid_or_outside_location_is_not_guessed(latitude, longitude):
    with pytest.raises(ValueError):
        module.home_place(latitude, longitude)


def test_polygon_holes_and_boundaries_are_handled():
    outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
    hole = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]
    assert module.polygon_contains([outer, hole], 2, 2) is True
    assert module.polygon_contains([outer, hole], 5, 5) is False
    assert module.polygon_contains([outer, hole], 0, 5) is None
    assert module.polygon_contains([outer, hole], 4, 5) is None


def test_binding_recalculates_station_and_retains_credentials():
    result = module.home_entry_data(
        {"private_key": "TEST_ONLY", "location_source": "manual"},
        {
            "id": "home_assistant",
            "name": "Ortuella",
            "province": "Bizkaia",
            "latitude": 43.31113,
            "longitude": -3.05617,
            "municipality_code": "48083",
        },
        [{"station_id": "near", "distance_km": 1.2}],
        {"location": "ortuella"},
    )
    assert result["private_key"] == "TEST_ONLY"
    assert result["location_source"] == "home_assistant"
    assert result["locality"] == "Ortuella" and result["location"] == "ortuella"
    assert result["station_id"] == "near" and result["selection_mode"] == "automatic"
