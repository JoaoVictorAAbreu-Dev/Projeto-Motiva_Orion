from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import httpx

from app.core.settings import settings


@dataclass
class RouteEstimate:
    distance_km: float
    duration_h: float


class OpenRouteService:
    def __init__(self) -> None:
        self._enabled = settings.openrouteservice_enabled
        self._api_key = settings.openrouteservice_api_key
        self._timeout = settings.openrouteservice_timeout_seconds
        self._max_calls = max(0, settings.openrouteservice_max_calls_per_run)
        self._calls = 0
        self._cache: dict[tuple[float, float, float, float], RouteEstimate] = {}

    def estimate_pair(self, start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> Optional[RouteEstimate]:
        if not self._enabled or not self._api_key:
            return None
        if self._calls >= self._max_calls:
            return None

        cache_key = (round(start_lat, 5), round(start_lon, 5), round(end_lat, 5), round(end_lon, 5))
        if cache_key in self._cache:
            return self._cache[cache_key]

        payload = {
            'coordinates': [
                [start_lon, start_lat],
                [end_lon, end_lat],
            ]
        }
        headers = {
            'Authorization': self._api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.post(
                    'https://api.openrouteservice.org/v2/directions/driving-car/json',
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
        except (httpx.HTTPError, ValueError, TypeError):
            return None

        routes = data.get('routes') or []
        if not routes:
            return None
        summary = routes[0].get('summary') or {}

        distance_m = float(summary.get('distance', 0))
        duration_s = float(summary.get('duration', 0))
        if distance_m <= 0 or duration_s <= 0:
            return None

        self._calls += 1
        estimate = RouteEstimate(distance_km=round(distance_m / 1000, 2), duration_h=round(duration_s / 3600, 2))
        self._cache[cache_key] = estimate
        return estimate

