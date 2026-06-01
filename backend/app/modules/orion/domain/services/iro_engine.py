from dataclasses import dataclass

from app.core.settings import settings


@dataclass(slots=True)
class IROConfig:
    vegetacao: float = settings.iro_weight_vegetacao
    dias_sem_manutencao: float = settings.iro_weight_dias_sem_manutencao
    chuva: float = settings.iro_weight_chuva
    criticidade_operacional: float = settings.iro_weight_criticidade_operacional
    risco_contratual: float = settings.iro_weight_risco_contratual
    ndvi_weight: float = settings.iro_ndvi_weight
    ndvi_threshold_dense: float = settings.iro_ndvi_threshold_dense
    ndvi_dense_boost: float = settings.iro_ndvi_dense_boost
    predicted_height_weight: float = settings.iro_predicted_height_weight


class OrionRiskEngine:
    def __init__(self, cfg: IROConfig | None = None) -> None:
        self.cfg = cfg or IROConfig()

    def compute_iro(
        self,
        nivel_rocada: float,
        dias_sem_manutencao: int,
        chuva_acumulada_mm: float,
        criticidade_operacional: float,
        risco_contratual: float,
        ndvi: float | None = None,
        predicted_height_cm: float | None = None,
        regulatory_limits_cm: dict[str, float] | None = None,
    ) -> float:
        score = (
            min(100.0, nivel_rocada) * self.cfg.vegetacao
            + min(100.0, dias_sem_manutencao * 1.8) * self.cfg.dias_sem_manutencao
            + min(100.0, chuva_acumulada_mm * 1.6) * self.cfg.chuva
            + min(100.0, criticidade_operacional) * self.cfg.criticidade_operacional
            + min(100.0, risco_contratual) * self.cfg.risco_contratual
        )

        if ndvi is not None:
            ndvi_score = max(0.0, min(1.0, ndvi)) * 100.0
            score = score * (1 - self.cfg.ndvi_weight) + ndvi_score * self.cfg.ndvi_weight
            if ndvi > self.cfg.ndvi_threshold_dense:
                score *= 1 + self.cfg.ndvi_dense_boost

        if predicted_height_cm is not None:
            height_score = min(100.0, max(0.0, predicted_height_cm))
            score = score * (1 - self.cfg.predicted_height_weight) + height_score * self.cfg.predicted_height_weight

            if regulatory_limits_cm:
                faixa_limite = regulatory_limits_cm.get('poda_altura_faixa_dominio_cm')
                entorno_limite = regulatory_limits_cm.get('poda_altura_entorno_instalacoes_cm')
                if faixa_limite and predicted_height_cm > faixa_limite:
                    score += min(20.0, (predicted_height_cm - faixa_limite) * 0.35)
                if entorno_limite and predicted_height_cm > entorno_limite:
                    score += min(20.0, (predicted_height_cm - entorno_limite) * 0.25)

        return round(max(0.0, min(100.0, score)), 1)

    @staticmethod
    def classify(iro: float) -> str:
        if iro <= 30:
            return 'Normal'
        if iro <= 60:
            return 'Atencao'
        return 'Critico'

