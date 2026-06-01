from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from app.core.settings import settings


class SentinelSatelliteService:
    def __init__(self) -> None:
        self.client_id = settings.sentinel_hub_client_id
        self.client_secret = settings.sentinel_hub_client_secret
        self.token_url = settings.sentinel_hub_token_url
        self.stats_url = settings.sentinel_stats_url
        self.timeout = settings.sentinel_timeout_seconds
        self._token: str | None = None
        self._token_exp: datetime | None = None

    async def _get_token(self) -> str:
        if self._token and self._token_exp and self._token_exp > datetime.now(timezone.utc):
            return self._token
        if not self.client_id or not self.client_secret:
            raise RuntimeError('Sentinel Hub credentials are not configured')

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                self.token_url,
                data={
                    'grant_type': 'client_credentials',
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                },
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
            )
            response.raise_for_status()
            payload = response.json()

        token = payload.get('access_token')
        expires_in = int(payload.get('expires_in', 0))
        if not token or expires_in <= 0:
            raise RuntimeError('Failed to resolve Sentinel Hub access token')

        self._token = token
        self._token_exp = datetime.now(timezone.utc) + timedelta(seconds=max(30, expires_in - 30))
        return token

    async def get_ndvi_mean(
        self,
        bbox: list[float],
        date_from: str,
        date_to: str,
        max_cloud_coverage: int = 30,
    ) -> Optional[float]:
        if len(bbox) != 4:
            raise ValueError('bbox must have 4 numeric values')

        token = await self._get_token()
        evalscript = """
        //VERSION=3
        function setup() {
          return {
            input: [{ bands: [\"B04\", \"B08\"] }],
            output: [{ id: \"default\", bands: 1 }]
          };
        }
        function evaluatePixel(sample) {
          let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 1e-6);
          return [ndvi];
        }
        """

        payload = {
            'input': {
                'bounds': {
                    'bbox': bbox,
                    'properties': {'crs': 'http://www.opengis.net/def/crs/EPSG/0/4326'},
                },
                'data': [{
                    'type': 'sentinel-2-l2a',
                    'dataFilter': {
                        'timeRange': {'from': f'{date_from}T00:00:00Z', 'to': f'{date_to}T23:59:59Z'},
                        'maxCloudCoverage': max_cloud_coverage,
                    },
                }],
            },
            'aggregation': {
                'timeRange': {'from': f'{date_from}T00:00:00Z', 'to': f'{date_to}T23:59:59Z'},
                'aggregationInterval': {'of': 'P1D'},
                'evalscript': evalscript,
            },
        }

        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(self.stats_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        dataset = data.get('data', [])
        if not dataset:
            return None

        means: list[float] = []
        for item in dataset:
            bands = item.get('outputs', {}).get('default', {}).get('bands', {}).get('B0', {})
            mean = bands.get('stats', {}).get('mean')
            if isinstance(mean, (float, int)):
                means.append(float(mean))

        if not means:
            return None
        return sum(means) / len(means)

