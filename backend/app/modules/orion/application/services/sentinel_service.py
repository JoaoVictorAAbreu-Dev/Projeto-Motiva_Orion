from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from hashlib import sha256

import httpx

from app.core.settings import settings


@dataclass
class SentinelNDVIResult:
    mime_type: str
    content: bytes
    cached: bool


class SentinelService:
    def __init__(self) -> None:
        self.enabled = settings.sentinel_enabled
        self.process_url = settings.sentinel_process_url
        self.token_url = settings.sentinel_token_url
        self.access_token = settings.sentinel_access_token
        self.client_id = settings.sentinel_client_id
        self.client_secret = settings.sentinel_client_secret
        self.timeout = settings.sentinel_timeout_seconds
        self.max_calls = max(0, settings.sentinel_max_calls_per_run)
        self.calls = 0
        self._cache: dict[str, SentinelNDVIResult] = {}
        self._oauth_token: str | None = None
        self._oauth_exp: datetime | None = None

    async def fetch_ndvi_image(self, bbox: list[float], date_from: str, date_to: str, width: int, height: int, max_cloud: int) -> SentinelNDVIResult:
        cache_key = self._build_cache_key(bbox, date_from, date_to, width, height, max_cloud)
        if cache_key in self._cache:
            hit = self._cache[cache_key]
            return SentinelNDVIResult(mime_type=hit.mime_type, content=hit.content, cached=True)

        if not self.enabled:
            raise RuntimeError('Sentinel integration is disabled.')
        if self.calls >= self.max_calls:
            raise RuntimeError('Sentinel call limit reached for this run.')

        token = await self._resolve_token()
        if not token:
            raise RuntimeError('Sentinel token unavailable.')

        payload = {
            'input': {
                'bounds': {
                    'bbox': bbox,
                    'properties': {'crs': 'http://www.opengis.net/def/crs/EPSG/0/4326'},
                },
                'data': [{
                    'type': 'sentinel-2-l2a',
                    'dataFilter': {
                        'timeRange': {'from': date_from, 'to': date_to},
                        'maxCloudCoverage': max_cloud,
                    },
                }],
            },
            'output': {
                'width': width,
                'height': height,
                'responses': [{'identifier': 'default', 'format': {'type': 'image/tiff'}}],
            },
            'evalscript': """
//VERSION=3
function setup() {
  return {
    input: ["B04","B08"],
    output: { bands: 1, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(s) {
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 1e-6);
  return [ndvi];
}
""",
        }

        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'Accept': 'image/tiff',
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(self.process_url, headers=headers, json=payload)
            response.raise_for_status()
            content = response.content
            mime_type = response.headers.get('content-type', 'image/tiff')

        self.calls += 1
        result = SentinelNDVIResult(mime_type=mime_type, content=content, cached=False)
        self._cache[cache_key] = result
        return result

    async def _resolve_token(self) -> str | None:
        if self.access_token:
            return self.access_token

        if self._oauth_token and self._oauth_exp and self._oauth_exp > datetime.now(timezone.utc):
            return self._oauth_token

        if not self.client_id or not self.client_secret:
            return None

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
            token_data = response.json()

        token = token_data.get('access_token')
        expires = int(token_data.get('expires_in', 0))
        if not token or expires <= 0:
            return None

        self._oauth_token = token
        self._oauth_exp = datetime.now(timezone.utc) + timedelta(seconds=max(30, expires - 30))
        return self._oauth_token

    @staticmethod
    def _build_cache_key(bbox: list[float], date_from: str, date_to: str, width: int, height: int, max_cloud: int) -> str:
        signature = f'{bbox}|{date_from}|{date_to}|{width}|{height}|{max_cloud}'
        return sha256(signature.encode('utf-8')).hexdigest()

