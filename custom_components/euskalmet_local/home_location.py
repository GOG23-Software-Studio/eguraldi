"""Identify HA's municipality locally; never send home coordinates to a geocoder."""

import gzip
import json
import math
from functools import lru_cache
from pathlib import Path

from .geography import LocationDiscoveryError

DATA = Path(__file__).parent / "data" / "municipalities.jsonl.gz"
PROVINCES = {"01": "Araba", "20": "Gipuzkoa", "48": "Bizkaia"}


def ring_contains(ring, longitude, latitude):
    """Ray casting with explicit edge detection. None means on a boundary."""
    if not ring:
        return False
    inside = False
    for a, b in zip(ring, [*ring[1:], ring[0]], strict=True):
        x1, y1 = a[:2]
        x2, y2 = b[:2]
        cross = (longitude - x1) * (y2 - y1) - (latitude - y1) * (x2 - x1)
        if (
            abs(cross) < 1e-13
            and min(x1, x2) <= longitude <= max(x1, x2)
            and min(y1, y2) <= latitude <= max(y1, y2)
        ):
            return None
        if (y1 > latitude) != (y2 > latitude) and longitude < x1 + (latitude - y1) * (
            x2 - x1
        ) / (y2 - y1):
            inside = not inside
    return inside


def polygon_contains(rings, longitude, latitude):
    if not rings:
        return False
    outer = ring_contains(rings[0], longitude, latitude)
    if outer is not True:
        return outer
    for hole in rings[1:]:
        contained = ring_contains(hole, longitude, latitude)
        if contained is None:
            return None
        if contained:
            return False
    return True


@lru_cache(maxsize=8)
def home_place(latitude: float, longitude: float) -> dict:
    """Resolve inside an executor. Stream polygons to bound memory usage."""
    if (
        not all(math.isfinite(value) for value in (latitude, longitude))
        or not -90 <= latitude <= 90
        or not -180 <= longitude <= 180
    ):
        raise LocationDiscoveryError("Invalid Home Assistant coordinates")
    matches = []
    with gzip.open(DATA, "rt", encoding="utf-8") as stream:
        next(stream)  # Source and attribution; no user data in this file.
        for line in stream:
            feature = json.loads(line)
            x1, y1, x2, y2 = feature["bbox"]
            if not (x1 <= longitude <= x2 and y1 <= latitude <= y2):
                continue
            geometry = feature["geometry"]
            polygons = geometry["coordinates"]
            if geometry["type"] == "Polygon":
                polygons = [polygons]
            results = [polygon_contains(p, longitude, latitude) for p in polygons]
            if None in results:
                raise LocationDiscoveryError("Municipal boundary: choose manually")
            if any(results):
                matches.append(feature["properties"])
    if len(matches) != 1:
        raise LocationDiscoveryError("No unambiguous municipality for HA location")
    properties = matches[0]
    province = PROVINCES.get(properties["MUN_PROV"])
    if province is None:
        raise LocationDiscoveryError("Outside the supported Basque municipalities")
    return {
        "id": "home_assistant",
        "name": properties["NOMBRE_CAS"] or properties["NOMBRE_EUS"],
        "aliases": [properties["NOMBRE_CAS"], properties["NOMBRE_EUS"]],
        "province": province,
        "region_name": "Euskadi",
        "municipality_code": properties["MUN_PROV"] + properties["MUN_MUNI"],
        "latitude": latitude,
        "longitude": longitude,
        "location_source": "home_assistant",
    }


async def resolve_home(hass, api):
    """Resolve municipality, closest station and forecast using HA's coordinates."""
    from .locality import rank_stations, resolve_forecast

    place = dict(
        await hass.async_add_executor_job(
            home_place, float(hass.config.latitude), float(hass.config.longitude)
        )
    )
    ranked = rank_stations(
        await api.list_compatible_stations(), place["latitude"], place["longitude"]
    )
    if not ranked:
        raise LocationDiscoveryError("No compatible station for HA location")
    forecast = await resolve_forecast(api, place)
    return place, ranked, forecast


def home_entry_data(previous, place, ranked, forecast):
    station = ranked[0]
    return {
        **previous,
        **station,
        **forecast,
        "latitude": place["latitude"],
        "longitude": place["longitude"],
        "locality": place["name"],
        "locality_id": place["id"],
        "locality_province": place["province"],
        "location_source": "home_assistant",
        "municipality_code": place["municipality_code"],
        "recommended_station": station["station_id"],
        "selection_mode": "automatic",
    }
