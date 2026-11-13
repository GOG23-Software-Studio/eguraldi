from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import pytest

spec = spec_from_file_location(
    "quality_test",
    Path(__file__).parents[1] / "custom_components/euskalmet_local/quality.py",
)
module = module_from_spec(spec)
spec.loader.exec_module(module)


@pytest.mark.parametrize("value", [0, 45.3, 100])
def test_valid_readings(value):
    assert module.valid_humidity(value)


@pytest.mark.parametrize(
    "value", [101.2, -1, float("nan"), float("inf"), True, None, "45"]
)
def test_source_anomalies_never_appear_as_valid_humidity(value):
    assert not module.valid_humidity(value)
