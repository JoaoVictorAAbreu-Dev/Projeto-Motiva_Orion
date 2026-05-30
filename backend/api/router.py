from fastapi import APIRouter

from services.ai_service import AIService
from services.import_service import ImportService
from services.mission_service import MissionService
from services.weather_service import WeatherService

router = APIRouter(prefix='/data', tags=['data'])


@router.get('/weather-summary')
def weather_summary() -> dict:
    return WeatherService.resumo_padrao()


@router.post('/import')
def import_data() -> dict:
    return ImportService().processar()


@router.post('/copilot')
def copilot(question: str) -> dict:
    context = ImportService().processar()
    return {'answer': AIService.resposta_local(question, context)}


@router.get('/missions')
def missions() -> list[dict]:
    trechos_payload = ImportService().processar()
    _ = trechos_payload
    return [m.__dict__ for m in MissionService.gerar_missoes([])]
