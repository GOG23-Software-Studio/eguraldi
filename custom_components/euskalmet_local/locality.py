"""Locality discovery and deterministic, explainable station selection."""

from __future__ import annotations

import math
from typing import Any

from .geography import LocationDiscoveryError, haversine_km, normalize_text

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
MAX_DISTANCE_KM = 120


def rank_stations(
    stations: list[dict], latitude: float, longitude: float
) -> list[dict]:
    """Choose the geographically closest compatible station.

    Coverage only breaks distance ties; all stations must publish temperature.
    The municipality coordinates are used, never the user's home coordinates.
    """
    if not all(math.isfinite(x) for x in (latitude, longitude)):
        raise LocationDiscoveryError("Invalid coordinates")
    ranked = []
    for station in stations:
        distance = haversine_km(
            latitude,
            longitude,
            station["station_latitude"],
            station["station_longitude"],
        )
        if distance > MAX_DISTANCE_KM:
            continue
        available = set(station.get("available_measures", []))
        if "temperature" not in available:
            continue
        penalty = sum(
            3 for key in ("humidity", "precipitation") if key not in available
        )
        ranked.append(
            {
                **station,
                "distance_km": distance,
                "selection_score": distance + penalty,
            }
        )
    return sorted(
        ranked,
        key=lambda item: (
            item["distance_km"],
            item["selection_score"],
            item["station_id"],
        ),
    )


async def search_localities(session: Any, query: str) -> list[dict]:
    """Only send the typed place name, never HA coordinates or credentials."""
    async with session.get(
        GEOCODING_URL,
        params={
            "name": query.strip(),
            "count": 10,
            "language": "es",
            "format": "json",
            "countryCode": "ES",
        },
        timeout=20,
    ) as response:
        response.raise_for_status()
        document = await response.json()
    results = []
    for place in document.get("results", []):
        if place.get("country_code") != "ES":
            continue
        try:
            lat, lon = float(place["latitude"]), float(place["longitude"])
        except (KeyError, TypeError, ValueError):
            continue
        if not math.isfinite(lat) or not math.isfinite(lon):
            continue
        results.append(
            {
                "id": str(place["id"]),
                "name": place["name"],
                "latitude": lat,
                "longitude": lon,
                "province": place.get("admin2", ""),
                "region_name": place.get("admin1", ""),
                "elevation": place.get("elevation"),
            }
        )
    return results


async def resolve_forecast(api: Any, place: dict) -> dict:
    """Match the chosen municipality to the official forecast catalog.

    Reject approximate matches instead of silently forecasting another town.
    """
    from .geography import alert_zone_for, catalog_identifier, catalog_names

    wanted = normalize_text(place["name"])
    matches = []
    for region in await api.get_regions():
        region_id = catalog_identifier(region, "region")
        if not region_id:
            continue
        for zone in await api.get_zones(region_id):
            zone_id = catalog_identifier(zone, "zone")
            if not zone_id:
                continue
            for location in await api.get_locations(region_id, zone_id):
                location_id = catalog_identifier(location, "location")
                names = catalog_names(location, location_id)
                aliases = {normalize_text(n) for n in names}
                aliases.add(normalize_text(location_id))
                # Bilingual catalogs also publish "Donostia / San Sebastián".
                for name in names:
                    aliases.update(normalize_text(part) for part in name.split("/"))
                if wanted in aliases or any(
                    f" {wanted} " in f" {alias} " for alias in aliases
                ):
                    matches.append(
                        {"region": region_id, "zone": zone_id, "location": location_id}
                    )
    unique = {(x["region"], x["zone"], x["location"]): x for x in matches}
    if len(unique) != 1:
        raise LocationDiscoveryError("Locality has no unambiguous Euskalmet forecast")
    return {
        **next(iter(unique.values())),
        "alert_zone": alert_zone_for(
            place["province"]
            .replace("Vizcaya", "Bizkaia")
            .replace("Guipúzcoa", "Gipuzkoa"),
            place["name"],
            place["latitude"],
        ),
    }
