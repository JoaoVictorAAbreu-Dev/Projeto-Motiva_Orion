from app.database.models import TrechoModel


class GrowthService:
    @staticmethod
    def estimate_growth(nivel_rocada: float, chuva_acumulada_mm: float, dias_sem_manutencao: int, historico_factor: float = 1.0) -> float:
        growth = (chuva_acumulada_mm * 0.22 + dias_sem_manutencao * 0.45 + nivel_rocada * 0.12) * historico_factor
        return round(max(0.0, min(100.0, growth)), 1)

    def forecast_trecho(self, trecho: TrechoModel) -> float:
        return self.estimate_growth(trecho.nivel_rocada, trecho.chuva_acumulada_mm, trecho.dias_sem_manutencao)

