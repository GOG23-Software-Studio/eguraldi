"""Publish a credential-free catalog for the bundled cards."""

import voluptuous as vol
from homeassistant.components import frontend, websocket_api
from homeassistant.core import callback
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN

VERSION = "0.1.0"
EVENT_LOCATIONS_UPDATED = f"{DOMAIN}_locations_updated"


@websocket_api.websocket_command({vol.Required("type"): "euskalmet_local/locations"})
@callback
def websocket_locations(hass, connection, msg):
    registry = er.async_get(hass)
    result = []
    for entry in hass.config_entries.async_entries(DOMAIN):
        entities = {}
        for entity in er.async_entries_for_config_entry(registry, entry.entry_id):
            if entity.disabled_by is None:
                key = entity.unique_id.removeprefix(entry.entry_id + "_")
                entities[key] = entity.entity_id
                if key == "precipitation_radar":
                    entities["radar"] = entity.entity_id
        coordinator = (
            hass.data.get(DOMAIN, {}).get("coordinators", {}).get(entry.entry_id)
        )
        if coordinator is not None:
            pollen_key = f"pollen_{coordinator.api.pollen_municipality_id}_total"
            entities["pollen_total"] = entities.get(pollen_key)
        result.append(
            {
                "entry_id": entry.entry_id,
                "locality": entry.data.get("locality", entry.title),
                "locality_id": entry.data.get("locality_id"),
                "location_source": entry.data.get("location_source", "manual"),
                "station": entry.data.get("station_name"),
                "station_id": entry.data.get("station_id"),
                "distance_km": entry.data.get("distance_km"),
                "selection_mode": entry.data.get("selection_mode"),
                "latitude": entry.data.get("latitude"),
                "longitude": entry.data.get("longitude"),
                "entities": entities,
            }
        )
    connection.send_result(msg["id"], result)


def register_dashboard(hass):
    websocket_api.async_register_command(hass, websocket_locations)
    frontend.add_extra_js_url(
        hass, f"/euskalmet_local_static/euskalmet-local-card.js?v={VERSION}"
    )
