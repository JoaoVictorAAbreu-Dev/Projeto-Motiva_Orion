from statistics import mean

import httpx


class WeatherService:
    def __init__(self, base_url: str = 'https://api.open-meteo.com/v1/forecast') -> None:
        self.base_url = base_url

    async def get_weather(self, latitude: float, longitude: float) -> dict:
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'hourly': 'temperature_2m,relative_humidity_2m',
            'daily': 'precipitation_sum',
            'forecast_days': 3,
            'timezone': 'auto',
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(self.base_url, params=params)
            response.raise_for_status()
            payload = response.json()

        hourly = payload.get('hourly', {})
        daily = payload.get('daily', {})

        temperatures = hourly.get('temperature_2m', [])[:24]
        humidities = hourly.get('relative_humidity_2m', [])[:24]
        precipitations = daily.get('precipitation_sum', [])

        return {
            'chuva_mm_3d': round(sum(precipitations), 2),
            'temperatura_media_24h': round(mean(temperatures), 1) if temperatures else 0.0,
            'umidade_media_24h': round(mean(humidities), 1) if humidities else 0.0,
        }

    @staticmethod
    def climate_risk_boost(chuva_mm_3d: float, umidade_media_24h: float) -> float:
        boost = chuva_mm_3d * 0.45 + max(0.0, umidade_media_24h - 60) * 0.2
        return round(min(20.0, boost), 1)

