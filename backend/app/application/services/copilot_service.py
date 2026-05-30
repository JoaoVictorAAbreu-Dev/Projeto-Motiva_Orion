import json

from app.application.services.decision_context_service import DecisionContextService
from app.domain.models import CopilotAnswerResponse
from app.infrastructure.external.groq_client import GroqClient


class CopilotService:
    def __init__(self) -> None:
        self.context_service = DecisionContextService()
        self.groq = GroqClient()

    async def ask(self, question: str, scenario: str) -> CopilotAnswerResponse:
        context = await self.context_service.get_context(scenario=scenario)

        prompt = (
            'Pergunta do operador:\n'
            f'{question}\n\n'
            'Contexto operacional (gerado pelo backend; nao recalcular):\n'
            f'{json.dumps(context.model_dump(), ensure_ascii=False)}\n\n'
            'Entregue resposta objetiva com:\n'
            '1) Decisao recomendada\n'
            '2) Justificativa com os valores recebidos\n'
            '3) Impacto esperado\n'
        )

        answer = await self.groq.ask(prompt)
        return CopilotAnswerResponse(answer=answer, source='groq')
