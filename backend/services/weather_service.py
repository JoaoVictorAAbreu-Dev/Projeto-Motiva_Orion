from datetime import datetime, timezone


class WeatherService:
    @staticmethod
    def resumo_padrao() -> dict:
        return {
            'provider': 'open-meteo',
            'captured_at': datetime.now(timezone.utc).isoformat(),
            'chuva_acumulada_mm_3d': 0.0,
            'temperatura_max_media_3d': 0.0,
            'vento_max_medio_3d': 0.0,
        }
