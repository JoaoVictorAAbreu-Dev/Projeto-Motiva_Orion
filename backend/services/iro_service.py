from domains.iro import IROResult
from domains.trecho import Trecho


class IROService:
    @staticmethod
    def calcular(trecho: Trecho) -> IROResult:
        score = (
            min(100.0, trecho.nivel_vegetacao) * 0.28
            + min(100.0, trecho.dias_sem_rocada * 1.8) * 0.24
            + min(100.0, trecho.chuva_prevista_mm * 1.5) * 0.16
            + min(100.0, trecho.trafego_estimado / 120) * 0.17
            + min(100.0, trecho.risco_contratual) * 0.15
        )
        valor = round(max(0.0, min(100.0, score)), 1)
        classificacao = 'critical' if valor >= 70 else 'attention' if valor >= 40 else 'normal'
        return IROResult(valor=valor, classificacao=classificacao)
