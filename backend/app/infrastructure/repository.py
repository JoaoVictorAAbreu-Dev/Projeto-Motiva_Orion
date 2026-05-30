from app.application.iro import with_iro
from app.domain.models import RoadSegment

SEED_SEGMENTS = [
    {"id": 1, "km_inicio": 12.4, "km_fim": 15.1, "latitude": -23.412, "longitude": -46.402, "nivel_vegetacao": 83, "dias_sem_rocada": 36, "chuva_prevista_mm": 22, "trafego_estimado": 9800, "risco_contratual": 84, "custo_estimado": 78000},
    {"id": 2, "km_inicio": 45.3, "km_fim": 47.0, "latitude": -23.251, "longitude": -46.901, "nivel_vegetacao": 62, "dias_sem_rocada": 24, "chuva_prevista_mm": 18, "trafego_estimado": 7100, "risco_contratual": 63, "custo_estimado": 51000},
    {"id": 3, "km_inicio": 66.7, "km_fim": 70.2, "latitude": -23.608, "longitude": -47.120, "nivel_vegetacao": 49, "dias_sem_rocada": 15, "chuva_prevista_mm": 8, "trafego_estimado": 4200, "risco_contratual": 38, "custo_estimado": 36000},
    {"id": 4, "km_inicio": 95.0, "km_fim": 98.6, "latitude": -22.995, "longitude": -46.511, "nivel_vegetacao": 91, "dias_sem_rocada": 41, "chuva_prevista_mm": 26, "trafego_estimado": 11400, "risco_contratual": 92, "custo_estimado": 92000},
    {"id": 5, "km_inicio": 123.2, "km_fim": 125.5, "latitude": -23.020, "longitude": -47.621, "nivel_vegetacao": 54, "dias_sem_rocada": 19, "chuva_prevista_mm": 12, "trafego_estimado": 5300, "risco_contratual": 49, "custo_estimado": 39500}
]


def load_segments() -> list[RoadSegment]:
    return [with_iro(segment) for segment in SEED_SEGMENTS]
