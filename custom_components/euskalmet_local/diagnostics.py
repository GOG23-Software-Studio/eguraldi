"""Small diagnostics with credentials and locality information redacted."""

from homeassistant.components.diagnostics import async_redact_data

from .dashboard import VERSION

TO_REDACT = {
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
    return {
        "entry": async_redact_data(dict(entry.data), TO_REDACT),
        "config_entry_version": entry.version,
        "integration_version": VERSION,
        "last_update_success": getattr(
            getattr(entry, "runtime_data", None), "last_update_success", None
        ),
    }
