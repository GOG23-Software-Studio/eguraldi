"""Local, auditable temperature calibration; no Home Assistant or network access."""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from math import isfinite
from statistics import mean, median
from zoneinfo import ZoneInfo

MODEL_VERSION = 1
WINDOW_DAYS = 28


def number(value):
    if value is None or isinstance(value, bool) or value == "":
        return None
    try:
        value = float(value)
    except (ValueError, TypeError):
        return None
    return value if isfinite(value) else None


def source_key(data, sensor):
    """Binding deliberately changes for station, location or outdoor entity changes."""
    import hashlib
    import json

    values = [
        data.get(k) for k in ("station_id", "locality_id", "latitude", "longitude")
    ]
    return hashlib.sha256(json.dumps([*values, sensor]).encode()).hexdigest()


def paired_hours(reference, outdoor, start, end):
    """Join completed UTC hours only, after the source binding began."""

    def rows(items):
        result = {}
        for row in items:
            stamp, value = number(row.get("start")), number(row.get("mean"))
            if stamp is None or value is None or not -50 <= value <= 60:
                continue
            if stamp > 100_000_000_000:
                stamp /= 1000
            if stamp % 3600 or stamp < start or stamp + 3600 > end:
                continue
            result[stamp] = value
        return result

    left, right = rows(reference), rows(outdoor)
    return [(stamp, left[stamp], right[stamp]) for stamp in sorted(left.keys() & right)]


def _fit(pairs, zone):
    global_bias = median(target - reference for _, reference, target in pairs)
    bins = []
    for hour in range(24):
        selected = [
            p
            for p in pairs
            if min(
                (datetime.fromtimestamp(p[0], zone).hour - hour) % 24,
                (hour - datetime.fromtimestamp(p[0], zone).hour) % 24,
            )
            <= 1
        ]
        dates = {datetime.fromtimestamp(p[0], zone).date() for p in selected}
        enough = len(selected) >= 12 and len(dates) >= 4
        bins.append(
            {
                "hour": hour,
                "correction": round(
                    median(t - r for _, r, t in selected) if enough else global_bias, 3
                ),
                "samples": len(selected),
                "method": "hourly" if enough else "global",
            }
        )
    return bins


def _summary(pairs):
    if not pairs:
        return {"samples": 0, "bias": None, "minimum": None, "maximum": None}
    differences = [target - reference for _, reference, target in pairs]
    return {
        "samples": len(pairs),
        "bias": round(mean(differences), 3),
        "minimum": round(min(differences), 3),
        "maximum": round(max(differences), 3),
    }


def analyse(
    reference,
    outdoor,
    *,
    now: datetime,
    since: datetime,
    time_zone: str,
    is_daylight: Callable[[datetime], bool],
):
    """Validate on two complete local days, strictly after the training period.

    This is reconstruction of hourly observations, NOT validation of a forecast.
    No random train/test split, interpolation, or imputation of missing readings.
    """
    zone = ZoneInfo(time_zone)
    end = int(now.timestamp() // 3600 * 3600)
    start = max(since.timestamp(), end - WINDOW_DAYS * 86400)
    pairs = paired_hours(reference, outdoor, start, end)
    today = now.astimezone(zone).replace(hour=0, minute=0, second=0, microsecond=0)
    validation_end = today.timestamp()
    validation_start = (today - timedelta(days=2)).timestamp()
    training = [p for p in pairs if p[0] < validation_start]
    validation = [p for p in pairs if validation_start <= p[0] < validation_end]
    daily_training, daily_validation = defaultdict(list), defaultdict(list)
    for p in training:
        daily_training[datetime.fromtimestamp(p[0], zone).date()].append(p)
    for p in validation:
        daily_validation[datetime.fromtimestamp(p[0], zone).date()].append(p)
    days = {datetime.fromtimestamp(p[0], zone).date() for p in pairs}
    possible = max(0, int((end - start) // 3600))
    report = {
        "model_version": MODEL_VERSION,
        "status": "learning",
        "since": since.isoformat(),
        "analysed_at": now.isoformat(),
        "paired_hours": len(pairs),
        "days": len(days),
        "coverage_percent": round(min(100, len(pairs) / possible * 100), 1)
        if possible
        else 0,
        "training_hours": len(training),
        "validation_hours": len(validation),
        "minimum_training_days": 5,
        "minimum_validation_days": 2,
        "summary": _summary(pairs),
        "hourly": [],
        "periods": {},
        "baseline_mae": None,
        "adjusted_mae": None,
        "improvement_percent": None,
        "error_p90": None,
        "validation_end": datetime.fromtimestamp(validation_end, UTC).isoformat(),
        "last_pair": datetime.fromtimestamp(pairs[-1][0], UTC).isoformat()
        if pairs
        else None,
    }
    for period, wanted in (("day", True), ("night", False)):
        report["periods"][period] = _summary(
            [
                p
                for p in pairs
                if is_daylight(datetime.fromtimestamp(p[0] + 1800, UTC)) == wanted
            ]
        )
    if pairs:
        report["hourly"] = _fit(pairs, zone)
    if (
        len(training) < 72
        or sum(len(v) >= 8 for v in daily_training.values()) < 5
        or len(daily_validation) != 2
        or any(len(v) < 12 for v in daily_validation.values())
    ):
        return report
    model = _fit(training, zone)
    report["hourly"] = model
    errors, baseline = [], []
    for stamp, station, target in validation:
        correction = model[datetime.fromtimestamp(stamp, zone).hour]["correction"]
        baseline.append(abs(target - station))
        errors.append(abs(target - (station + correction)))
    raw_mae, adjusted_mae = mean(baseline), mean(errors)
    gain = raw_mae - adjusted_mae
    improvement = gain / raw_mae * 100 if raw_mae > 0 else 0
    each_day_improves = all(
        mean(
            abs(t - (r + model[datetime.fromtimestamp(s, zone).hour]["correction"]))
            for s, r, t in group
        )
        < mean(abs(t - r) for _, r, t in group)
        for group in daily_validation.values()
    )
    report.update(
        {
            "status": "validated"
            if gain >= 0.2 and improvement >= 10 and each_day_improves
            else "not_improved",
            "baseline_mae": round(raw_mae, 3),
            "adjusted_mae": round(adjusted_mae, 3),
            "improvement_percent": round(improvement, 1),
            "error_p90": round(
                sorted(errors)[min(len(errors) - 1, int(len(errors) * 0.9))], 3
            ),
        }
    )
    return report
