from datetime import datetime, timezone


class SatelliteClient:
    """MVP: dados simulados para Sentinel Hub / Copernicus."""

    async def get_vegetation_signal(self, latitude: float, longitude: float) -> dict:
        ndvi = 0.42 + ((abs(latitude) + abs(longitude)) % 0.2)
        evi = ndvi * 0.78
        return {
            'provider': 'simulated-sentinel',
            'captured_at': datetime.now(timezone.utc).isoformat(),
            'ndvi': round(min(0.95, ndvi), 3),
            'evi': round(min(0.9, evi), 3),
            'note': 'MVP com dados simulados. Integracao real pendente.',
        }
