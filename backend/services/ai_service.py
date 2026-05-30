import json


class AIService:
    @staticmethod
    def resposta_local(question: str, context: dict) -> str:
        return (
            'Copiloto local: ' + question + '\n'
            'Contexto recebido do backend (resumo): ' + json.dumps({
                'trechos_criticos': context.get('trechos_criticos'),
                'missoes_recomendadas': context.get('missoes_recomendadas'),
                'indice_medio_risco': context.get('indice_medio_risco'),
            }, ensure_ascii=False)
        )
