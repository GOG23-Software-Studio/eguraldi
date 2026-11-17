"""Shared validation for the optional wizard and admin configuration action."""

from __future__ import annotations

import voluptuous as vol
from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.service import async_register_admin_service
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .microclimate_model import source_key


def microclimate_options(hass, entry, values):
    enabled = values.get("microclimate_enabled", False)
    sensor = values.get("microclimate_sensor")
    state = hass.states.get(sensor) if sensor else None
    record = er.async_get(hass).async_get(sensor) if sensor else None
    errors = {}
    if enabled and (
        not state
        or state.attributes.get("device_class") != "temperature"
        or state.attributes.get("unit_of_measurement") not in ("°C", "°F")
        or state.attributes.get("state_class") != "measurement"
        or (record and record.platform == DOMAIN)
    ):
        errors["microclimate_sensor"] = "invalid_microclimate_sensor"
    if enabled and not values.get("microclimate_outdoors_confirmed"):
        errors["microclimate_outdoors_confirmed"] = "confirm_outdoor_sensor"
    source = source_key(entry.data, sensor)
    reset = not entry.options.get(
        "microclimate_enabled"
    ) or source != entry.options.get("microclimate_source")
    since = (
        dt_util.utcnow().isoformat()
        if reset
        else entry.options.get("microclimate_since", dt_util.utcnow().isoformat())
    )
    return {
        **entry.options,
        **values,
        "microclimate_enabled": enabled,
        "microclimate_sensor": sensor,
        "microclimate_source": source,
        "microclimate_since": since,
    }, errors


@callback
def async_register_microclimate_service(hass):
    async def configure(call):
        entry = hass.config_entries.async_get_entry(call.data["entry_id"])
        if entry is None or entry.domain != DOMAIN:
            raise HomeAssistantError("Select an Eguraldi location")
        values = {key: value for key, value in call.data.items() if key != "entry_id"}
        options, errors = microclimate_options(hass, entry, values)
        if errors:
            raise HomeAssistantError("; ".join(errors.values()))
        hass.config_entries.async_update_entry(entry, options=options)

    async_register_admin_service(
        hass,
        DOMAIN,
        "configure_microclimate",
        configure,
        schema=vol.Schema(
            {
                vol.Required("entry_id"): str,
                vol.Required("microclimate_enabled"): bool,
                vol.Optional("microclimate_sensor"): str,
                vol.Required("microclimate_outdoors_confirmed"): bool,
            }
        ),
    )
