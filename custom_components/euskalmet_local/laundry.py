"""Opt-in laundry monitoring for one configured locality."""

import logging
from datetime import timedelta

from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .laundry_model import (
    DEFAULTS,
    allowed_time,
    forecast_fresh,
    notification_message,
    risks,
    source_key,
    timestamp,
)

_LOGGER = logging.getLogger(__name__)


def destinations(hass):
    """Only explicitly selected destinations; never the generic notify broadcast."""
    result = {"persistent_notification": "Home Assistant"}
    for entity_id in hass.states.async_entity_ids("notify"):
        state = hass.states.get(entity_id)
        result[f"entity:{entity_id}"] = state.name if state else entity_id
    for service in hass.services.async_services().get("notify", {}):
        if service not in {"notify", "send_message", "reload"}:
            result[f"service:{service}"] = f"notify.{service}"
    return result


class LaundryCoordinator(DataUpdateCoordinator):
    def __init__(self, hass, entry):
        super().__init__(
            hass,
            _LOGGER,
            name=f"Eguraldi laundry {entry.entry_id}",
            update_interval=timedelta(minutes=1),
            config_entry=entry,
        )
        self.entry = entry
        self.options = {**DEFAULTS, **entry.options}
        for key in ("laundry_lead_minutes", "laundry_cooldown_minutes"):
            self.options[key] = int(self.options[key])
        self.store = Store(hass, 1, f"{DOMAIN}.laundry.{entry.entry_id}")
        self.source = source_key(
            {
                **entry.data,
                "location": (
                    entry.data.get("location"),
                    self.options["laundry_target"],
                ),
            }
        )
        self.session = {}
        self.active = False
        self.status = "disabled" if not self.options["laundry_enabled"] else "idle"
        self.last_sent = None
        self.stopping = False

    async def async_initialize(self):
        saved = await self.store.async_load() or {}
        self.last_sent = timestamp(saved.get("last_sent"))
        if saved.get("source") == self.source:
            self.session = saved.get("session") or {}
        self._expire(dt_util.utcnow())
        await self._save()

    def _expire(self, now):
        started = timestamp(self.session.get("started"))
        self.active = bool(
            self.options["laundry_enabled"]
            and started
            and timedelta(0) <= now - started < timedelta(hours=24)
        )
        if not self.active:
            self.session = {}

    async def _save(self):
        await self.store.async_save(
            {
                "source": self.source,
                "session": self.session,
                "last_sent": self.last_sent.isoformat() if self.last_sent else None,
            }
        )

    async def async_set_active(self, active):
        if active and (self.active or not self.options["laundry_enabled"]):
            return
        self.session = (
            {"started": dt_util.utcnow().isoformat(), "sent": []} if active else {}
        )
        self.active = active
        await self._save()
        await self.async_refresh()

    async def _async_update_data(self):
        now = dt_util.utcnow()
        self._expire(now)
        self.status = "disabled" if not self.options["laundry_enabled"] else "idle"
        if not self.active:
            return {}
        self.status = self.session.get("delivery", "watching")
        if not allowed_time(
            dt_util.as_local(now),
            self.options["laundry_start"],
            self.options["laundry_end"],
        ):
            self.status = "quiet_hours"
            return {}
        provider = self.entry.runtime_data
        fresh = getattr(provider, "hourly_forecast_updated", None)
        if not fresh or not timedelta(0) <= now - fresh <= timedelta(hours=2):
            self.status = "no_forecast"
            return {}
        document = (provider.data or {}).get("forecast_hourly") or {}
        if not forecast_fresh(document, now):
            self.status = "no_forecast"
            return {}
        upcoming = risks(document, now, self.options)
        sent = set(self.session.get("sent", []))
        candidate = next((r for r in upcoming if set(r["kinds"]) - sent), None)
        if not candidate:
            return {}
        if self.last_sent and now - self.last_sent < timedelta(
            minutes=self.options["laundry_cooldown_minutes"]
        ):
            self.status = "cooldown"
            return {}
        target = self.options["laundry_target"]
        if target not in destinations(self.hass):
            self.status = "target_unavailable"
            return {}
        kinds = sorted(set(candidate["kinds"]) - sent)
        locality = self.entry.data.get("locality", self.entry.title)
        title = f"Eguraldi · {locality}"
        message = notification_message(locality, kinds, self.hass.config.language)
        # Persist the reservation before delivery, including uncertain responses.
        session = self.session
        self.session["sent"] = sorted(sent | set(kinds))
        self.last_sent = now
        self.session["delivery"] = "delivery_failed"
        await self._save()
        if self.stopping or not self.active or self.session is not session:
            return {}
        try:
            if target == "persistent_notification":
                await self.hass.services.async_call(
                    "persistent_notification",
                    "create",
                    {
                        "title": title,
                        "message": message,
                        "notification_id": f"eguraldi_laundry_{self.entry.entry_id}",
                    },
                    blocking=True,
                )
            elif target.startswith("entity:"):
                await self.hass.services.async_call(
                    "notify",
                    "send_message",
                    {
                        "title": title,
                        "message": message,
                        "entity_id": target.removeprefix("entity:"),
                    },
                    blocking=True,
                )
            else:
                await self.hass.services.async_call(
                    "notify",
                    target.removeprefix("service:"),
                    {"title": title, "message": message},
                    blocking=True,
                )
            self.status = "notified"
            self.session["delivery"] = "notified"
            await self._save()
        except Exception:
            self.status = "delivery_failed"
            _LOGGER.warning(
                "Laundry notification could not be confirmed for entry %s",
                self.entry.entry_id,
            )
        return {}

    async def async_shutdown(self):
        self.stopping = True
        await super().async_shutdown()
