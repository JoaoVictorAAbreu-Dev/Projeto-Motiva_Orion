from dataclasses import dataclass

from app.core.settings import settings


@dataclass(slots=True)
class IROConfig:
    vegetacao: float = settings.iro_weight_vegetacao
    dias_sem_manutencao: float = settings.iro_weight_dias_sem_manutencao
    chuva: float = settings.iro_weight_chuva
    criticidade_operacional: float = settings.iro_weight_criticidade_operacional
    risco_contratual: float = settings.iro_weight_risco_contratual


class OrionRiskEngine:
    def __init__(self, cfg: IROConfig | None = None) -> None:
        self.cfg = cfg or IROConfig()

    def compute_iro(self, nivel_rocada: float, dias_sem_manutencao: int, chuva_acumulada_mm: float, criticidade_operacional: float, risco_contratual: float) -> float:
        score = (
            min(100.0, nivel_rocada) * self.cfg.vegetacao
            + min(100.0, dias_sem_manutencao * 1.8) * self.cfg.dias_sem_manutencao
            + min(100.0, chuva_acumulada_mm * 1.6) * self.cfg.chuva
            + min(100.0, criticidade_operacional) * self.cfg.criticidade_operacional
            + min(100.0, risco_contratual) * self.cfg.risco_contratual
        )
        return round(max(0.0, min(100.0, score)), 1)

    @staticmethod
    def classify(iro: float) -> str:
        if iro <= 30:
            return 'Normal'
        if iro <= 60:
            return 'Atencao'
        return 'Critico'
