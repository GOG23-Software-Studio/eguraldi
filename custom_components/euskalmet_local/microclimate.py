"""Private per-entry microclimate analysis over local Recorder statistics."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from functools import partial

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.core import callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.event import (
    async_track_state_change_event,
    async_track_time_interval,
)
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import (
    CoordinatorEntity,
    DataUpdateCoordinator,
)
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .microclimate_model import WINDOW_DAYS, analyse, number, source_key

_LOGGER = logging.getLogger(__name__)
SPECS = {
    "status": ("microclimate_status", None, "mdi:weather-partly-cloudy"),
    "bias": ("microclimate_bias", "°C", "mdi:thermometer-lines"),
    "difference": ("microclimate_difference", "°C", "mdi:thermometer-chevron-up"),
    "estimate": ("microclimate_estimate", "°C", "mdi:thermometer-auto"),
    "error": ("microclimate_error", "°C", "mdi:chart-bell-curve"),
    "coverage": ("microclimate_coverage", "%", "mdi:chart-timeline-variant"),
}


def _timestamp(value):
    if isinstance(value, datetime):
        result = value
    elif isinstance(value, str):
        result = dt_util.parse_datetime(value)
    else:
        return None
    return result if result and result.tzinfo else None


class MicroclimateCoordinator(DataUpdateCoordinator):
    def __init__(self, hass, entry):
        super().__init__(
            hass,
            _LOGGER,
            name=f"Eguraldi microclimate {entry.entry_id}",
            update_interval=timedelta(minutes=30),
            config_entry=entry,
        )
        self.entry = entry
        self.outdoor = entry.options.get("microclimate_sensor")
        self.store = Store(hass, 1, f"{DOMAIN}.microclimate.{entry.entry_id}")
        self.since = dt_util.utcnow()

    @property
    def reference(self):
        return er.async_get(self.hass).async_get_entity_id(
            "sensor", DOMAIN, f"{self.entry.entry_id}_temperature"
        )

    async def async_initialize(self):
        source = source_key(self.entry.data, self.outdoor)
        stored = await self.store.async_load() or {}
        requested = _timestamp(self.entry.options.get("microclimate_since", ""))
        stored_since = _timestamp(stored.get("since", ""))
        now = dt_util.utcnow()
        if stored.get("source") == source and stored_since:
            self.since = stored_since
            if (
                self.entry.options.get("microclimate_source") == source
                and requested
                and requested > self.since
            ):
                self.since = requested
        else:
            # Even returning to a previously used station must start a new scope.
            # Recorder entity IDs survive station changes and may contain mixed sources.
            self.since = now
        self.since = min(self.since, now)
        await self.store.async_save({"source": source, "since": self.since.isoformat()})

    @callback
    def async_start(self):
        sources = [id for id in (self.reference, self.outdoor) if id]
        self.entry.async_on_unload(
            async_track_state_change_event(self.hass, sources, self._source_changed)
        )
        self.entry.async_on_unload(
            async_track_time_interval(
                self.hass, self._source_changed, timedelta(minutes=5)
            )
        )

    @callback
    def _source_changed(self, event):
        self.async_update_listeners()

    async def _async_update_data(self):
        from astral import Observer
        from astral.sun import elevation
        from homeassistant.components.recorder.statistics import (
            statistics_during_period,
        )
        from homeassistant.helpers.recorder import get_instance

        now = dt_util.utcnow()
        if not self.reference or not self.outdoor:
            return {"status": "history_unavailable", "since": self.since.isoformat()}
        start = max(self.since, now - timedelta(days=WINDOW_DAYS))
        try:
            result = await get_instance(self.hass).async_add_executor_job(
                statistics_during_period,
                self.hass,
                start,
                now,
                {self.reference, self.outdoor},
                "hour",
                {"temperature": "°C"},
                {"mean"},
            )
            observer = Observer(
                float(self.entry.data["latitude"]), float(self.entry.data["longitude"])
            )
            report = await self.hass.async_add_executor_job(
                partial(
                    analyse,
                    result.get(self.reference, []),
                    result.get(self.outdoor, []),
                    now=now,
                    since=self.since,
                    time_zone=self.hass.config.time_zone,
                    is_daylight=lambda date: elevation(observer, date) >= 0,
                )
            )
        except Exception:  # Recorder is optional; weather must keep working.
            _LOGGER.debug("Microclimate statistics unavailable", exc_info=True)
            return {"status": "history_unavailable", "since": self.since.isoformat()}
        report["sensor_name"] = (
            self.hass.states.get(self.outdoor).name
            if (self.hass.states.get(self.outdoor))
            else self.outdoor
        )
        return report

    def reading(self, entity_id):
        state = self.hass.states.get(entity_id) if entity_id else None
        if not state:
            return None
        value = number(state.state)
        unit = state.attributes.get("unit_of_measurement")
        if value is None or unit not in ("°C", "°F"):
            return None
        if entity_id == self.reference:
            stamp = _timestamp(state.attributes.get("observed_at", ""))
            if state.attributes.get("stale") or stamp is None:
                return None
        else:
            stamp = state.last_reported
        age = (dt_util.utcnow() - stamp).total_seconds()
        if age < -120 or age > 2700:
            return None
        value = (value - 32) * 5 / 9 if unit == "°F" else value
        return (value, stamp) if -50 <= value <= 60 else None

    def live_values(self):
        reference, outdoor = self.reading(self.reference), self.reading(self.outdoor)
        difference = None
        if (
            reference
            and outdoor
            and abs((reference[1] - outdoor[1]).total_seconds()) <= 900
        ):
            difference = round(outdoor[0] - reference[0], 2)
        estimate = None
        data = self.data or {}
        latest = _timestamp(data.get("last_pair") or "")
        if (
            reference
            and data.get("status") == "validated"
            and latest
            and (dt_util.utcnow() - latest).total_seconds() < 86400
        ):
            hour = dt_util.as_local(dt_util.utcnow()).hour
            correction = next(
                (
                    item["correction"]
                    for item in data.get("hourly", [])
                    if item["hour"] == hour
                ),
                None,
            )
            if correction is not None:
                estimate = round(reference[0] + correction, 2)
        return {
            "reference_temperature": reference[0] if reference else None,
            "outdoor_temperature": outdoor[0] if outdoor else None,
            "current_difference": difference,
            "estimate": estimate,
        }


class MicroclimateSensor(CoordinatorEntity, SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, coordinator, key):
        super().__init__(coordinator)
        self.key = key
        suffix, unit, icon = SPECS[key]
        self._attr_unique_id = f"{coordinator.entry.entry_id}_{suffix}"
        self._attr_translation_key = suffix
        self._attr_native_unit_of_measurement = unit
        self._attr_icon = icon
        self._attr_suggested_display_precision = 2 if key != "status" else None
        if key == "estimate":
            self._attr_device_class = SensorDeviceClass.TEMPERATURE
        if key == "status":
            self._attr_device_class = SensorDeviceClass.ENUM
            self._attr_options = [
                "learning",
                "validated",
                "not_improved",
                "history_unavailable",
            ]
        else:
            self._attr_state_class = SensorStateClass.MEASUREMENT
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{coordinator.entry.entry_id}_microclimate")},
            manufacturer="GOG23 Software Studio",
            model="Microclimate",
            name=f"{coordinator.entry.data.get('locality', 'Eguraldi')} · Microclima",
        )

    @property
    def available(self):
        return True

    @property
    def native_value(self):
        data = self.coordinator.data or {}
        if self.key == "status":
            return data.get("status", "learning")
        if self.key == "bias":
            return data.get("summary", {}).get("bias")
        if self.key == "coverage":
            return data.get("coverage_percent", 0)
        if self.key == "error":
            return data.get("adjusted_mae")
        values = self.coordinator.live_values()
        return values["estimate" if self.key == "estimate" else "current_difference"]

    @property
    def extra_state_attributes(self):
        if self.key != "status":
            return None
        return {
            **(self.coordinator.data or {}),
            **self.coordinator.live_values(),
            "outdoor_sensor": self.coordinator.outdoor,
            "reference_sensor": self.coordinator.reference,
            "scope": "hourly_observation_reconstruction",
            "temperature_unit": "°C",
        }
