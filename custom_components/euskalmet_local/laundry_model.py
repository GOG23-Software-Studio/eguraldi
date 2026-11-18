"""Conservative hourly laundry risks; no Home Assistant dependencies."""

import math
from datetime import UTC, datetime, time, timedelta

DEFAULTS = {
    "laundry_enabled": False,
    "laundry_target": "",
    "laundry_lead_minutes": 30,
    "laundry_rain": True,
    "laundry_wind": True,
    "laundry_wind_kmh": 30,
    "laundry_start": "08:00:00",
    "laundry_end": "22:00:00",
    "laundry_cooldown_minutes": 120,
}


def number(value):
    if isinstance(value, bool):
        return None
    try:
        result = float(value)
        return result if math.isfinite(result) and result >= 0 else None
    except (ValueError, TypeError):
        return None


def timestamp(value):
    try:
        parsed = datetime.fromisoformat(value)
        return parsed.astimezone(UTC) if parsed.tzinfo else None
    except (ValueError, TypeError):
        return None


def allowed_time(now, start, end):
    """Equal endpoints mean all day; overnight ranges are supported."""
    clock = now.time().replace(tzinfo=None)
    start, end = time.fromisoformat(start), time.fromisoformat(end)
    return start == end or (
        start <= clock < end if start < end else clock >= start or clock < end
    )


def source_key(data):
    return str(
        tuple(
            data.get(k)
            for k in ("locality_id", "latitude", "longitude", "location", "station_id")
        )
    )


def forecast_fresh(document, now):
    if not isinstance(document, dict):
        return False
    issued = timestamp(document.get("at"))
    trends = document.get("trends")
    items = trends.get("set") if isinstance(trends, dict) else None
    return bool(
        issued
        and timedelta(minutes=-5) <= now - issued <= timedelta(hours=12)
        and isinstance(items, list)
        and items
    )


def risks(document, now, options):
    """Include the active block. Hourly start times are estimates, never nowcasting."""
    result = []
    if not forecast_fresh(document, now):
        return result
    trends = document.get("trends")
    items = trends.get("set", []) if isinstance(trends, dict) else []
    for item in items:
        if not isinstance(item, dict):
            continue
        try:
            date = item.get("_forecast_date") or document["for"][:10]
            hour = int(item["range"].split("[", 1)[1].split(":", 1)[0])
            start = datetime.fromisoformat(date).replace(hour=hour, tzinfo=UTC)
        except (KeyError, ValueError, TypeError, IndexError):
            continue
        if (
            not start <= now + timedelta(minutes=options["laundry_lead_minutes"])
            or start + timedelta(hours=1) <= now
        ):
            continue

        def measure(key, item=item):
            field = item.get(key)
            return number(field.get("value")) if isinstance(field, dict) else None

        symbol_set = item.get("symbolSet")
        weather = symbol_set.get("weather", {}) if isinstance(symbol_set, dict) else {}
        code = str(weather.get("id", "")) if isinstance(weather, dict) else ""
        rain = measure("precipitation")
        wind = measure("windspeed")
        kinds = []
        if options["laundry_rain"] and (
            (rain is not None and rain > 0)
            or code in {"08", "09", "10", "11", "12", "13", "14", "15", "16"}
        ):
            kinds.append("rain")
        if (
            options["laundry_wind"]
            and wind is not None
            and wind * 3.6 >= options["laundry_wind_kmh"]
        ):
            kinds.append("wind")
        if kinds:
            result.append({"start": start, "kinds": kinds})
    return sorted(result, key=lambda risk: risk["start"])


def notification_message(locality, kinds, language="es"):
    """Natural speech shared by every notification destination."""
    combined = "rain" in kinds and "wind" in kinds
    if str(language).startswith("eu"):
        risk = (
            "euria eta haize zakarra"
            if combined
            else ("euria" if "rain" in kinds else "haize zakarra")
        )
        return (
            f"Laster {risk} espero da {locality} inguruan. "
            "Arropa kanpoan baduzu, jasotzea komeni da."
        )
    risk = (
        "lluvia y viento fuerte"
        if combined
        else ("lluvia" if "rain" in kinds else "viento fuerte")
    )
    verb = "Se esperan" if combined else "Se espera"
    return (
        f"{verb} {risk} próximamente en {locality}. "
        "Si tienes ropa tendida, conviene recogerla."
    )
