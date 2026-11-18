"""Laundry session control; notifications stay opt-in."""

from homeassistant.components.switch import SwitchEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN

PARALLEL_UPDATES = 0


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([LaundrySwitch(hass.data[DOMAIN]["laundry"][entry.entry_id])])


class LaundrySwitch(CoordinatorEntity, SwitchEntity):
    _attr_has_entity_name = True
    _attr_translation_key = "laundry_out"
    _attr_icon = "mdi:hanger"

    def __init__(self, coordinator):
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.entry.entry_id}_laundry_out"

    @property
    def device_info(self):
        entry = self.coordinator.entry
        return DeviceInfo(identifiers={(DOMAIN, f"{entry.entry_id}_locality")})

    @property
    def is_on(self):
        return self.coordinator.active

    @property
    def extra_state_attributes(self):
        return {
            "alerts_enabled": self.coordinator.options["laundry_enabled"],
            "monitoring_status": self.coordinator.status,
            "session_started": self.coordinator.session.get("started"),
        }

    async def async_turn_on(self, **kwargs):
        await self.coordinator.async_set_active(True)

    async def async_turn_off(self, **kwargs):
        await self.coordinator.async_set_active(False)
