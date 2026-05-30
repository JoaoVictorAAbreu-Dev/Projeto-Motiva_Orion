from datetime import datetime, timezone

import httpx

from app.core.settings import settings


class OpenMeteoClient:
    async def get_forecast(self, latitude: float, longitude: float) -> dict:
        url = f"{settings.open_meteo_base_url}/forecast"
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'daily': 'precipitation_sum,temperature_2m_max,wind_speed_10m_max',
            'forecast_days': 3,
            'timezone': 'auto',
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                payload = response.json().get('daily', {})
            precipitation = payload.get('precipitation_sum', [0.0])
            temperature = payload.get('temperature_2m_max', [0.0])
            wind = payload.get('wind_speed_10m_max', [0.0])
        except Exception:
            precipitation = [0.0, 0.0, 0.0]
            temperature = [0.0, 0.0, 0.0]
            wind = [0.0, 0.0, 0.0]

        return {
            'provider': 'open-meteo',
            'captured_at': datetime.now(timezone.utc).isoformat(),
            'chuva_acumulada_mm_3d': round(sum(precipitation), 2),
            'temperatura_max_media_3d': round(sum(temperature) / max(1, len(temperature)), 1),
            'vento_max_medio_3d': round(sum(wind) / max(1, len(wind)), 1),
        }
