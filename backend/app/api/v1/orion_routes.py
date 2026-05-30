from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.application.services.operational_bootstrap_service import OperationalBootstrapService
from app.application.services.operational_plan_service import OperationalPlanService
from app.application.services.report_service import build_report_pdf
from app.application.services.ai_service import AIService
from app.core.auth import Token, authenticate_user, create_access_token, get_current_user, require_roles
from app.database.models import UsuarioModel
from app.database.session import get_db
from app.domain.schemas import (
    ConformidadeRead,
    CopilotAskRequest,
    CopilotAskResponse,
    DashboardRead,
    IndicadorRead,
    LoginRequest,
    MissaoRead,
    PlanoSemanalRead,
    TrechoRead,
)
from app.repositories.core_repositories import IndicadorRepository, IntervencaoRepository, MissaoRepository, TrechoRepository

router = APIRouter(prefix='/api/v1', tags=['orion'])


@router.post('/auth/login', response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail='Usuario ou senha invalidos')
    token = create_access_token(subject=user.email, perfil=user.perfil)
    return Token(access_token=token, token_type='bearer')


@router.post('/auth/login-json', response_model=Token)
def login_json(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail='Usuario ou senha invalidos')
    token = create_access_token(subject=user.email, perfil=user.perfil)
    return Token(access_token=token, token_type='bearer')


@router.get('/auth/me')
def me(user: UsuarioModel = Depends(get_current_user)) -> dict:
    return {'id': user.id, 'nome': user.nome, 'email': user.email, 'perfil': user.perfil}


@router.post('/bootstrap')
async def bootstrap_data(
    db: Session = Depends(get_db),
    _: UsuarioModel = Depends(require_roles('admin', 'gestor'))
) -> dict:
    service = OperationalBootstrapService(db)
    raw_dir = Path(__file__).resolve().parents[3] / 'data' / 'raw'
    return await service.load_from_raw(raw_dir)


@router.post('/imports/gestao-verde')
async def import_gestao_verde(
    db: Session = Depends(get_db),
    _: UsuarioModel = Depends(require_roles('admin', 'gestor'))
) -> dict:
    service = OperationalBootstrapService(db)
    default_paths = [
        Path(r'C:\Users\jv921\Downloads\Arquivos - Dados challenge MOTIVA\02. Dados Gestão verde - Atual\Retigrafico\RA-RET-ROÇ-LIMP-2026-03-13.xlsx'),
        Path(r'C:\Users\jv921\Downloads\Arquivos - Dados challenge MOTIVA\02. Dados Gestão verde - Atual\Retigrafico\RA-RET-ROÇ-LIMP-2026-03-20.xlsx')
    ]
    return await service.load_from_paths(default_paths)


@router.get('/trechos', response_model=list[TrechoRead])
def list_trechos(db: Session = Depends(get_db), _: UsuarioModel = Depends(get_current_user)) -> list[TrechoRead]:
    return TrechoRepository(db).list()


@router.get('/trechos/criticos', response_model=list[TrechoRead])
def list_trechos_criticos(db: Session = Depends(get_db), _: UsuarioModel = Depends(get_current_user)) -> list[TrechoRead]:
    return TrechoRepository(db).list_criticos()


@router.get('/trechos/{trecho_id}', response_model=TrechoRead)
def get_trecho(trecho_id: int, db: Session = Depends(get_db), _: UsuarioModel = Depends(get_current_user)) -> TrechoRead:
    trecho = TrechoRepository(db).get(trecho_id)
    if trecho is None:
        raise HTTPException(status_code=404, detail='Trecho nao encontrado')
    return trecho


@router.get('/indicadores', response_model=list[IndicadorRead])
def list_indicadores(db: Session = Depends(get_db), _: UsuarioModel = Depends(get_current_user)) -> list[IndicadorRead]:
    return IndicadorRepository(db).list()


@router.get('/missoes', response_model=list[MissaoRead])
def list_missoes(db: Session = Depends(get_db), _: UsuarioModel = Depends(get_current_user)) -> list[MissaoRead]:
    return MissaoRepository(db).list()


@router.post('/plano-semanal/gerar', response_model=PlanoSemanalRead)
def generate_weekly_plan(
    db: Session = Depends(get_db),
    _: UsuarioModel = Depends(require_roles('admin', 'gestor', 'coordenador'))
) -> PlanoSemanalRead:
    trechos = TrechoRepository(db).list()
    missoes = MissaoRepository(db).list()
    return PlanoSemanalRead(**OperationalPlanService.build_weekly_plan(trechos, missoes))


@router.get('/conformidade', response_model=ConformidadeRead)
def conformidade(db: Session = Depends(get_db), _: UsuarioModel = Depends(get_current_user)) -> ConformidadeRead:
    trechos = TrechoRepository(db).list()
    intervencoes = IntervencaoRepository(db).count()

    total = len(trechos)
    risco = len([t for t in trechos if t.risco_contratual >= 70 or t.classificacao == 'Critico'])
    conformidade_geral = round(max(0.0, 100 - ((risco / total) * 100)), 1) if total else 0.0
    prazo_medio = round(sum(max(1, t.recomendacao_prazo_dias) for t in trechos) / total, 1) if total else 0.0

    return ConformidadeRead(
        conformidade_geral=conformidade_geral,
        trechos_risco_contratual=risco,
        prazo_medio_restante_dias=prazo_medio,
        historico_intervencoes=intervencoes,
    )


@router.get('/dashboard', response_model=DashboardRead)
def dashboard(db: Session = Depends(get_db), _: UsuarioModel = Depends(get_current_user)) -> DashboardRead:
    trechos = TrechoRepository(db).list()
    missoes = MissaoRepository(db).list()

    total = len(trechos)
    criticos = len([t for t in trechos if t.classificacao == 'Critico'])
    indice_medio = round(sum(t.iro for t in trechos) / total, 1) if total else 0.0
    economia = round(sum(m.economia_logistica_estimada for m in missoes), 2)
    conformidade_contratual = round(max(0.0, 100 - ((criticos / total) * 100)), 1) if total else 0.0

    return DashboardRead(
        total_trechos=total,
        trechos_criticos=criticos,
        missoes_planejadas=len(missoes),
        economia_potencial=economia,
        indice_medio_risco=indice_medio,
        conformidade_contratual=conformidade_contratual,
    )


@router.get('/relatorios/{tipo}')
def report(tipo: str, db: Session = Depends(get_db), _: UsuarioModel = Depends(get_current_user)) -> Response:
    trechos = TrechoRepository(db).list()
    missoes = MissaoRepository(db).list()

    tipo_normalizado = tipo.lower()
    if tipo_normalizado not in {'operacional', 'executivo', 'conformidade'}:
        raise HTTPException(status_code=400, detail='Tipo de relatorio invalido')

    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
    criticos = len([t for t in trechos if t.classificacao == 'Critico'])

    lines = [
        f'Data de geracao: {now}',
        f'Trechos monitorados: {len(trechos)}',
        f'Trechos criticos: {criticos}',
        f'Missoes planejadas: {len(missoes)}',
        f'Custo total estimado: R$ {sum(m.custo_estimado for m in missoes):,.2f}',
    ]

    if tipo_normalizado == 'conformidade':
        lines.append(f'Conformidade estimada: {round(max(0.0, 100 - ((criticos / max(1, len(trechos))) * 100)), 1)}%')

    pdf_bytes = build_report_pdf(f'Relatorio {tipo_normalizado.title()} - Motiva ORION', lines)
    return Response(
        content=pdf_bytes,
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename=relatorio_{tipo_normalizado}.pdf'}
    )


@router.post('/copilot/perguntar', response_model=CopilotAskResponse)
async def ask_copilot(
    payload: CopilotAskRequest,
    db: Session = Depends(get_db),
    _: UsuarioModel = Depends(require_roles('admin', 'gestor', 'coordenador', 'operador'))
) -> CopilotAskResponse:
    trechos = TrechoRepository(db).list()
    missoes = MissaoRepository(db).list()
    criticos = [t for t in trechos if t.classificacao == 'Critico']
    custo_total = float(sum(m.custo_estimado for m in missoes))
    dashboard = {
        'total_trechos': len(trechos),
        'trechos_criticos': len(criticos),
        'missoes_planejadas': len(missoes),
        'indice_medio_risco': round(sum(t.iro for t in trechos) / max(1, len(trechos)), 1),
    }
    context = {
        'dashboard': dashboard,
        'missoes': {'custo_total': custo_total},
        'top_trechos': [{'id': t.id, 'iro': t.iro, 'classificacao': t.classificacao} for t in trechos[:10]],
    }
    resposta = await AIService().explain(payload.pergunta, context)
    return CopilotAskResponse(resposta=resposta)
