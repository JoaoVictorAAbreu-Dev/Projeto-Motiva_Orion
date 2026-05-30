from app.database.models import TrechoModel


class PrioritizationService:
    @staticmethod
    def rank(trechos: list[TrechoModel]) -> list[TrechoModel]:
        return sorted(trechos, key=lambda t: (t.iro, t.risco_contratual, t.dias_sem_manutencao), reverse=True)
