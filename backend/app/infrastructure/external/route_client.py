from datetime import datetime, timezone

import httpx

from app.core.settings import settings


class RouteClient:
    async def matrix(self, coordinates: list[list[float]]) -> dict:
        if not settings.openrouteservice_api_key:
            return {
                'provider': 'openrouteservice',
                'captured_at': datetime.now(timezone.utc).isoformat(),
                'enabled': False,
                'note': 'OPENROUTESERVICE_API_KEY nao definido',
            }

        url = f"{settings.openrouteservice_base_url}/matrix/driving-car"
        headers = {'Authorization': settings.openrouteservice_api_key}
        payload = {'locations': coordinates, 'metrics': ['distance', 'duration'], 'units': 'km'}

        async with httpx.AsyncClient(timeout=14.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        return {
            'provider': 'openrouteservice',
            'captured_at': datetime.now(timezone.utc).isoformat(),
            'enabled': True,
            'distances': data.get('distances', []),
            'durations': data.get('durations', []),
        }
