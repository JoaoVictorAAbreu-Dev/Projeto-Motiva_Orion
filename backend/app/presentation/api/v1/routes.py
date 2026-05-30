from fastapi import APIRouter

from app.application.services.copilot_service import CopilotService
from app.application.services.decision_context_service import DecisionContextService
from app.domain.models import CopilotAnswerResponse, CopilotQuestionRequest, OperationalContext, RoadSegment
from app.infrastructure.repository import load_segments

router = APIRouter()
context_service = DecisionContextService()
copilot_service = CopilotService()


@router.get('/segments', response_model=list[RoadSegment])
def list_segments() -> list[RoadSegment]:
    return load_segments()


@router.get('/decision-context', response_model=OperationalContext)
async def decision_context(scenario: str = 'seguranca') -> OperationalContext:
    return await context_service.get_context(scenario=scenario)


@router.post('/copilot/ask', response_model=CopilotAnswerResponse)
async def copilot_ask(payload: CopilotQuestionRequest) -> CopilotAnswerResponse:
    return await copilot_service.ask(question=payload.question, scenario=payload.scenario)
