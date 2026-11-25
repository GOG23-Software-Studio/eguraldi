"""TEST ONLY: simulated provider boundary. Never install in a real home."""

from datetime import UTC, datetime, timedelta


async def async_setup(hass, config):
    from custom_components.euskalmet_local.api import EuskalmetAPI

    async def regions(self):
        return [{"id": "basque_country", "name": "Euskadi"}]

    async def zones(self, region):
        return [{"id": "cantabrian_valleys", "name": "Cantabrian valleys"}]

    async def locations(self, region, zone):
        return [{"id": "ORTUELLA", "name": "Ortuella"}]

    async def stations(self):
        return [
            {
                "station_id": "C061",
                "station_name": "Arboleda LAB",
                "station_latitude": 43.285,
                "station_longitude": -3.055,
                "available_measures": [
                    "temperature",
                    "humidity",
                    "precipitation",
                    "wind_speed",
                ],
                "missing_measures": [],
            },
            {
                "station_id": "C042",
                "station_name": "Other station LAB",
                "station_latitude": 43.33,
                "station_longitude": -3.01,
                "available_measures": [
                    "temperature",
                    "humidity",
                    "precipitation",
                    "wind_speed",
                ],
                "missing_measures": [],
            },
        ]

    async def current(self):
        now = datetime.now(UTC).isoformat()
        return {
            k: {"value": v, "date": now, "observed_on": now, "unit": u}
            for k, v, u in [
                ("temperature", 15 if self.station_id == "C061" else 17, "C"),
                ("humidity", 70, "%"),
                ("precipitation", 0, "mm"),
                ("wind_speed", 10, "km/h"),
            ]
        }

    async def daily(self):
        now = datetime.now(UTC)
        return [
            {
                "date": (now + timedelta(days=i)).date().isoformat(),
                "temperatureRange": {"min": 8 + i, "max": 16 + i},
                "weather": {"id": "02"},
            }
            for i in range(7)
        ]

    async def hourly(self):
        now = datetime.now(UTC)
        start = now.replace(minute=0, second=0, microsecond=0)
        return {
            "at": now.isoformat(),
            "for": start.isoformat(),
            "trends": {
                "set": [
                    {
                        "range": f"[{d:%H}:00..{(d + timedelta(hours=1)):%H}:00)",
                        "_forecast_date": d.date().isoformat(),
                        "temperature": {"value": 14 + i % 6},
                        "humidity": {"value": 65},
                        "precipitation": {"value": 0},
                        "windspeed": {"value": 3},
                        "symbolSet": {"weather": {"id": "02"}},
                    }
                    for i in range(48)
                    for d in [start + timedelta(hours=i)]
                ]
            },
        }

    async def empty(self, *args, **kwargs):
        return {}

    async def alerts(self):
        return self._empty_alerts()

    async def radar(self):
        return self._empty_radar()

    async def blocked(self, *args, **kwargs):
        raise RuntimeError("LAB blocks outbound provider requests")

    for name, fn in {
        "get_regions": regions,
        "get_zones": zones,
        "get_locations": locations,
        "list_compatible_stations": stations,
        "get_station_capabilities": empty,
        "get_station": empty,
        "get_all_measurements": current,
        "get_daily_forecast": daily,
        "get_hourly_forecast": hourly,
        "get_alerts": alerts,
        "get_radar_report": radar,
        "get_aggregated_day_summary": empty,
        "get_aggregated_month_summary": empty,
        "get_ocean_forecast": empty,
        "get_tides": empty,
        "get_pollen_measurements": empty,
        "get_astro_calendar": empty,
        "get_aggregated_day": empty,
        "_request": blocked,
        "_request_public": blocked,
    }.items():
        setattr(EuskalmetAPI, name, fn)
    return True
