"""Extract only explicit levels and local hours from official alert headings."""

import re
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

ALERT_ZONE = ZoneInfo("Europe/Madrid")
LEVELS = {"amarillo": "yellow", "naranja": "orange", "rojo": "red"}
HEADING = re.compile(
    r"^\s*[-–]?\s*(?:aviso|alerta|alarma)\s+(amarillo|naranja|rojo)\b",
    re.IGNORECASE,
)
HOURS = re.compile(
    r"\bdesde\s+las\s+(\d{1,2})(?::(\d{2}))?\s+hasta\s+las\s+"
    r"(\d{1,2})(?::(\d{2}))?\s+hora\s+local\b",
    re.IGNORECASE,
)


def alert_period(description: str, valid_for: object) -> dict:
    """Keep missing or ambiguous data unknown; never interpret the body forecast."""
    heading = description.split(".", 1)[0]
    level = HEADING.search(heading)
    result = {
        "level": LEVELS[level[1].lower()] if level else None,
        "starts_at": None,
        "ends_at": None,
        "time_zone": "Europe/Madrid",
    }
    hours = HOURS.search(heading)
    if not hours:
        return result
    try:
        date = datetime.fromisoformat(str(valid_for).replace("Z", "+00:00"))
        if date.tzinfo is None:
            return result
        day = date.astimezone(ALERT_ZONE).date()
        start_h, start_m, end_h, end_m = [int(v or 0) for v in hours.groups()]
        if not (0 <= start_h < 24 and 0 <= end_h <= 24):
            return result
        if not (0 <= start_m < 60 and 0 <= end_m < 60):
            return result
        if end_h == 24 and end_m != 0:
            return result
        start = datetime.combine(day, time(start_h, start_m), ALERT_ZONE)
        end = datetime.combine(
            day + timedelta(days=end_h == 24), time(end_h % 24, end_m), ALERT_ZONE
        )
        if end <= start:
            return result
        result.update(starts_at=start.isoformat(), ends_at=end.isoformat())
    except (TypeError, ValueError, OverflowError):
        pass
    return result
