"""Small diagnostics with credentials and locality information redacted."""

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.util import dt as dt_util

from .dashboard import VERSION
from .forecast_quality import forecast_is_fresh

TO_REDACT = {
    "station_id",
    "station_name",
    "station_latitude",
    "station_longitude",
    "distance_km",
    "recommended_station",
    "email",
    "private_key",
    "latitude",
    "longitude",
    "locality",
    "locality_id",
    "locality_province",
    "municipality",
    "municipality_code",
    "location",
    "region",
    "zone",
    "alert_zone",
}


async def async_get_config_entry_diagnostics(hass, entry):
    coordinator = getattr(entry, "runtime_data", None)
    now = dt_util.utcnow()
    forecasts = {}
    if coordinator is not None:
        for kind in ("hourly", "daily"):
            updated = getattr(coordinator, f"{kind}_forecast_updated", None)
            forecasts[kind] = {
                "last_successful_fetch": updated.isoformat() if updated else None,
                "stale": not forecast_is_fresh(coordinator, kind, now),
            }
    return {
        "forecasts": forecasts,
        "failed_endpoints": sorted(getattr(coordinator, "_failed_endpoints", [])),
        "entry": async_redact_data(dict(entry.data), TO_REDACT),
        "config_entry_version": entry.version,
        "integration_version": VERSION,
        "last_update_success": getattr(
            getattr(entry, "runtime_data", None), "last_update_success", None
        ),
    }
