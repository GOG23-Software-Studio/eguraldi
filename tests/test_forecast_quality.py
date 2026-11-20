"""Forecast expiry is independent of successful observation updates."""

from datetime import UTC, datetime, timedelta
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from types import SimpleNamespace

PATH = (
    Path(__file__).parents[1] / "custom_components/euskalmet_local/forecast_quality.py"
)
spec = spec_from_file_location("forecast_quality", PATH)
quality = module_from_spec(spec)
spec.loader.exec_module(quality)
NOW = datetime(2026, 11, 20, 12, tzinfo=UTC)


def provider():
    return SimpleNamespace(
        hourly_forecast_updated=NOW,
        daily_forecast_updated=NOW,
        data={
            "forecast_hourly": {"at": NOW.isoformat(), "trends": {"set": [{}]}},
            "forecast_daily": [{"date": "2026-11-20"}],
        },
    )


def test_fetch_age_limits_do_not_confuse_attempt_with_success():
    source = provider()
    assert quality.forecast_is_fresh(source, "hourly", NOW + timedelta(hours=2))
    assert not quality.forecast_is_fresh(
        source, "hourly", NOW + timedelta(hours=2, seconds=1)
    )
    assert quality.forecast_is_fresh(source, "daily", NOW + timedelta(hours=6))
    assert not quality.forecast_is_fresh(
        source, "daily", NOW + timedelta(hours=6, seconds=1)
    )
    source.hourly_forecast_updated = None
    assert not quality.forecast_is_fresh(source, "hourly", NOW)


def test_download_does_not_make_an_old_provider_document_fresh():
    source = provider()
    source.data["forecast_hourly"]["at"] = (NOW - timedelta(hours=13)).isoformat()
    assert not quality.forecast_is_fresh(source, "hourly", NOW)
    for value in (None, "bad", "2026-11-20T12:00:00"):
        source.data["forecast_hourly"]["at"] = value
        assert not quality.forecast_is_fresh(source, "hourly", NOW)


def test_empty_invalid_and_future_data_never_count_as_fresh():
    source = provider()
    for data in (None, {}, {"forecast_daily": [], "forecast_hourly": {}}):
        source.data = data
        for kind in ("daily", "hourly"):
            assert not quality.forecast_is_fresh(source, kind, NOW)
    assert not quality.recent(NOW + timedelta(seconds=1), NOW, timedelta(hours=2))
