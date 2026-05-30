from datetime import datetime, timezone

import httpx

from app.core.settings import settings


class GeoClient:
    async def reverse_geocode(self, latitude: float, longitude: float) -> dict:
        url = f"{settings.nominatim_base_url}/reverse"
        params = {'lat': latitude, 'lon': longitude, 'format': 'jsonv2'}
        headers = {'User-Agent': 'Motiva-ORION/0.1'}

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()
            display_name = data.get('display_name', 'N/A')
        except Exception:
            display_name = 'N/A'

        return {
            'provider': 'nominatim',
            'captured_at': datetime.now(timezone.utc).isoformat(),
            'display_name': display_name,
        }

    async def highway_context(self, latitude: float, longitude: float) -> dict:
        query = f"""
        [out:json][timeout:12];
        (
          way(around:800,{latitude},{longitude})["highway"];
        );
        out tags qt 20;
        """
        url = f"{settings.overpass_base_url}/interpreter"

        roads = []
        note = ''
        try:
            headers = {'Content-Type': 'text/plain', 'Accept': 'application/json'}
            async with httpx.AsyncClient(timeout=14.0) as client:
                response = await client.post(url, content=query, headers=headers)
                response.raise_for_status()
                elements = response.json().get('elements', [])

            for element in elements[:8]:
                tags = element.get('tags', {})
                roads.append({'name': tags.get('name', 'Via sem nome'), 'type': tags.get('highway', 'unknown')})
        except Exception:
            note = 'Overpass indisponivel no momento'

        return {
            'provider': 'overpass',
            'captured_at': datetime.now(timezone.utc).isoformat(),
            'nearby_roads': roads,
            'note': note,
        }
