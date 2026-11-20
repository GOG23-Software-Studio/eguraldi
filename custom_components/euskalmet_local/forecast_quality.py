"""Age checks shared by standard weather entities and diagnostics."""

from datetime import datetime, timedelta

MAX_AGE = {"hourly": timedelta(hours=2), "daily": timedelta(hours=6)}


def recent(value, now, maximum, future_tolerance=timedelta(0)):
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return False
    return bool(
        isinstance(value, datetime)
        and value.tzinfo
        and -future_tolerance <= now - value <= maximum
    )


def forecast_is_fresh(coordinator, kind, now):
    updated = getattr(coordinator, f"{kind}_forecast_updated", None)
    if not recent(updated, now, MAX_AGE[kind]):
        return False
    data = (getattr(coordinator, "data", None) or {}).get(f"forecast_{kind}")
    if kind == "daily":
        return isinstance(data, list) and bool(data)
    if not isinstance(data, dict):
        return False
    trends = data.get("trends")
    return bool(
        isinstance(trends, dict)
        and isinstance(trends.get("set"), list)
        and trends["set"]
        and recent(data.get("at"), now, timedelta(hours=12), timedelta(minutes=5))
    )


def alerts_are_fresh(coordinator, now):
    data = (getattr(coordinator, "data", None) or {}).get("alerts")
    return bool(
        isinstance(data, dict)
        and data.get("complete", True) is not False
        and recent(
            getattr(coordinator, "alerts_updated", None), now, timedelta(minutes=45)
        )
        and "alerts" not in getattr(coordinator, "_failed_endpoints", set())
    )
