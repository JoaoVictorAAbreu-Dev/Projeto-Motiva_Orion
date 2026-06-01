from app.database.models import TrechoModel


class RecommendationService:
    @staticmethod
    def recommend(iro: float, crescimento_previsto: float) -> tuple[str, int, str]:
        if iro >= 61:
            return ('Executar rocada imediata', 3, 'Roçada mecanizada com apoio manual')
        if iro >= 31:
            if crescimento_previsto > 50:
                return ('Programar intervencao preventiva', 7, 'Roçada seletiva setorizada')
            return ('Inspecionar e monitorar', 14, 'Inspecao de campo')
        return ('Manter monitoramento de rotina', 30, 'Monitoramento remoto')

    def apply(self, trecho: TrechoModel, iro: float, crescimento_previsto: float) -> TrechoModel:
        acao, prazo, metodo = self.recommend(iro, crescimento_previsto)
        trecho.recomendacao_acao = acao
        trecho.recomendacao_prazo_dias = prazo
        trecho.recomendacao_metodo = metodo
        return trecho

