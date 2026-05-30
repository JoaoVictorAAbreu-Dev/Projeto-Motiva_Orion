from dataclasses import dataclass


@dataclass(slots=True)
class Trecho:
    id: int
    km_inicio: float
    km_fim: float
    latitude: float
    longitude: float
    nivel_vegetacao: float
    dias_sem_rocada: int
    chuva_prevista_mm: float
    trafego_estimado: int
    risco_contratual: float
    custo_estimado: float
    status: str = 'normal'
    iro: float = 0.0
