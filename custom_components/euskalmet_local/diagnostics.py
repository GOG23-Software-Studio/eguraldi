"""Small diagnostics with credentials and locality information redacted."""

from homeassistant.components.diagnostics import async_redact_data

TO_REDACT = {
    "email",
    "private_key",
    "latitude",
    "longitude",
    "locality",
    "locality_id",
    "locality_province",
    "municipality",
}


async def async_get_config_entry_diagnostics(hass, entry):
    return {
        "entry": async_redact_data(dict(entry.data), TO_REDACT),
        "version": entry.version,
        "last_update_success": entry.runtime_data.last_update_success,
    }
