from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.application.services.operational_bootstrap_service import OperationalBootstrapService
from app.database.session import get_db
from app.domain.schemas import DashboardRead, IndicadorRead, MissaoRead, TrechoRead
from app.repositories.core_repositories import IndicadorRepository, MissaoRepository, TrechoRepository

router = APIRouter(prefix='/api/v1', tags=['orion'])


@router.post('/bootstrap')
async def bootstrap_data(db: Session = Depends(get_db)) -> dict:
    service = OperationalBootstrapService(db)
    raw_dir = Path(__file__).resolve().parents[3] / 'data' / 'raw'
    return await service.load_from_raw(raw_dir)


@router.get('/trechos', response_model=list[TrechoRead])
def list_trechos(db: Session = Depends(get_db)) -> list[TrechoRead]:
    return TrechoRepository(db).list()


@router.get('/trechos/criticos', response_model=list[TrechoRead])
def list_trechos_criticos(db: Session = Depends(get_db)) -> list[TrechoRead]:
    return TrechoRepository(db).list_criticos()


@router.get('/trechos/{trecho_id}', response_model=TrechoRead)
def get_trecho(trecho_id: int, db: Session = Depends(get_db)) -> TrechoRead:
    trecho = TrechoRepository(db).get(trecho_id)
    if trecho is None:
        raise HTTPException(status_code=404, detail='Trecho nao encontrado')
    return trecho


@router.get('/indicadores', response_model=list[IndicadorRead])
def list_indicadores(db: Session = Depends(get_db)) -> list[IndicadorRead]:
    return IndicadorRepository(db).list()


@router.get('/missoes', response_model=list[MissaoRead])
def list_missoes(db: Session = Depends(get_db)) -> list[MissaoRead]:
    return MissaoRepository(db).list()


@router.get('/dashboard', response_model=DashboardRead)
def dashboard(db: Session = Depends(get_db)) -> DashboardRead:
    trechos = TrechoRepository(db).list()
    missoes = MissaoRepository(db).list()

    total = len(trechos)
    criticos = len([t for t in trechos if t.classificacao == 'Critico'])
    indice_medio = round(sum(t.iro for t in trechos) / total, 1) if total else 0.0
    economia = round(sum(m.economia_logistica_estimada for m in missoes), 2)

    return DashboardRead(
        total_trechos=total,
        trechos_criticos=criticos,
        missoes_planejadas=len(missoes),
        economia_potencial=economia,
        indice_medio_risco=indice_medio,
    )

