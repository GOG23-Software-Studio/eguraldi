"""Calibration acceptance is checked on time-separated unseen days."""

import importlib.util
from datetime import UTC, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

PATH = (
    Path(__file__).resolve().parents[1]
    / "custom_components/euskalmet_local/microclimate_model.py"
)
spec = importlib.util.spec_from_file_location("microclimate_model", PATH)
model = importlib.util.module_from_spec(spec)
spec.loader.exec_module(model)
NOW = datetime(2026, 11, 17, 12, tzinfo=UTC)


def history(days=14, bias=lambda hour, day: 2):
    start = NOW.replace(hour=0) - timedelta(days=days)
    left, right = [], []
    for i in range(days * 24):
        date = start + timedelta(hours=i)
        value = 10 + (i % 24) / 4
        left.append({"start": date.timestamp(), "mean": value})
        right.append({"start": date.timestamp(), "mean": value + bias(i % 24, i // 24)})
    return left, right, start


def analyse(left, right, since):
    return model.analyse(
        left,
        right,
        now=NOW,
        since=since,
        time_zone="Europe/Paris",
        is_daylight=lambda date: 8 <= date.hour < 18,
    )


def test_hourly_patterns_and_genuine_holdout_improvement():
    left, right, start = history(bias=lambda hour, day: 1 if hour < 8 else 3)
    result = analyse(left, right, start)
    assert result["status"] == "validated"
    assert result["training_hours"] > result["validation_hours"] >= 24
    assert result["adjusted_mae"] < result["baseline_mae"]
    assert result["improvement_percent"] > 70
    assert result["hourly"][3]["correction"] < result["hourly"][15]["correction"]
    assert result["periods"]["day"]["bias"] > result["periods"]["night"]["bias"]


def test_no_improvement_does_not_enable_model():
    left, right, start = history(bias=lambda hour, day: 0)
    result = analyse(left, right, start)
    assert result["status"] == "not_improved"
    assert result["baseline_mae"] == result["adjusted_mae"] == 0


def test_no_future_leakage_from_validation_into_training():
    # Training says +4, the two unseen days change to -4. A leaked model would fit -4.
    left, right, start = history(bias=lambda hour, day: 4 if day < 12 else -4)
    result = analyse(left, right, start)
    assert result["status"] == "not_improved"
    assert result["adjusted_mae"] > result["baseline_mae"]
    assert result["hourly"][12]["correction"] == 4


def test_incomplete_validation_stays_learning():
    left, right, start = history()
    validation_start = NOW.astimezone(ZoneInfo("Europe/Paris")).replace(
        hour=0
    ) - timedelta(days=2)
    right = [r for r in right if r["start"] < validation_start.timestamp()]
    result = analyse(left, right, start)
    assert result["status"] == "learning"
    assert result["validation_hours"] == 0
    assert result["baseline_mae"] is None


def test_sensor_or_station_reset_excludes_previous_pairs():
    left, right, start = history()
    reset = NOW - timedelta(hours=12)
    result = analyse(left, right, reset)
    assert result["paired_hours"] <= 12
    assert result["status"] == "learning"
    data = {
        "station_id": "C061",
        "locality_id": "Ortuella",
        "latitude": 43.3,
        "longitude": -3,
    }
    key = model.source_key(data, "sensor.outdoor")
    assert key != model.source_key({**data, "station_id": "OTHER"}, "sensor.outdoor")
    assert key != model.source_key({**data, "latitude": 43.4}, "sensor.outdoor")
    assert key != model.source_key(data, "sensor.other")


def test_pairs_never_fill_gaps_or_accept_incomplete_or_nonphysical_values():
    stamp = NOW.replace(hour=0).timestamp()
    left = [{"start": stamp + i * 3600, "mean": 10} for i in range(5)]
    right = [
        {"start": stamp + i * 3600, "mean": v}
        for i, v in enumerate([None, "", True, 90, 0])
    ]
    pairs = model.paired_hours(left, right, stamp, stamp + 5 * 3600)
    assert pairs == [(stamp + 4 * 3600, 10, 0)]
    assert model.paired_hours(left, right, stamp, stamp + 4 * 3600) == []
    right[-1]["start"] *= 1000
    assert model.paired_hours(left, right, stamp, stamp + 5 * 3600) == pairs


def test_minimum_seven_days_is_not_a_promise_if_coverage_is_missing():
    left, right, start = history(days=5)
    assert analyse(left, right, start)["status"] == "learning"
    left, right, start = history()
    # One reading per day is not enough, even after two weeks.
    right = [r for i, r in enumerate(right) if i % 24 == 0]
    assert analyse(left, right, start)["status"] == "learning"


def test_dst_hours_remain_distinct_in_utc_and_coverage_is_bounded():
    zone = ZoneInfo("Europe/Paris")
    first = datetime(2026, 10, 25, 2, tzinfo=zone, fold=0).timestamp()
    second = datetime(2026, 10, 25, 2, tzinfo=zone, fold=1).timestamp()
    assert second - first == 3600
    rows = [{"start": stamp, "mean": 10} for stamp in [first, second]]
    assert len(model.paired_hours(rows, rows, first, second + 3600)) == 2
    left, right, start = history()
    assert 0 <= analyse(left + left, right + right, start)["coverage_percent"] <= 100
