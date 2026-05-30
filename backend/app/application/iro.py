from app.domain.models import RoadSegment


def calculate_iro(
    nivel_vegetacao: float,
    dias_sem_rocada: int,
    chuva_prevista_mm: float,
    trafego_estimado: int,
    risco_contratual: float,
) -> float:
    vegetation_factor = min(100.0, nivel_vegetacao)
    maintenance_factor = min(100.0, dias_sem_rocada * 1.8)
    rain_factor = min(100.0, chuva_prevista_mm * 1.5)
    traffic_factor = min(100.0, trafego_estimado / 120)
    contractual_factor = min(100.0, risco_contratual)

    score = (
        vegetation_factor * 0.28
        + maintenance_factor * 0.24
        + rain_factor * 0.16
        + traffic_factor * 0.17
        + contractual_factor * 0.15
    )

    return round(max(0.0, min(100.0, score)), 1)


def with_iro(segment_data: dict) -> RoadSegment:
    iro = calculate_iro(
        nivel_vegetacao=segment_data["nivel_vegetacao"],
        dias_sem_rocada=segment_data["dias_sem_rocada"],
        chuva_prevista_mm=segment_data["chuva_prevista_mm"],
        trafego_estimado=segment_data["trafego_estimado"],
        risco_contratual=segment_data["risco_contratual"],
    )
    status = "critical" if iro >= 70 else "attention" if iro >= 40 else "normal"
    return RoadSegment(**segment_data, iro=iro, status=status)
