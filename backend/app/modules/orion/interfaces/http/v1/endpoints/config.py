from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_roles
from app.database.models import UsuarioModel
from app.database.session import get_db
from app.modules.orion.domain.schemas import RegulatoryRuleRead, RegulatoryRuleUpsert
from app.modules.orion.infrastructure.persistence.core_repositories import RegulatoryRuleRepository

router = APIRouter(prefix='/api/v1/config', tags=['config'])


@router.get('/regulatory-rules', response_model=list[RegulatoryRuleRead])
def list_regulatory_rules(
    db: Session = Depends(get_db),
    _: UsuarioModel = Depends(require_roles('admin', 'gestor', 'coordenador', 'operador')),
) -> list[RegulatoryRuleRead]:
    return RegulatoryRuleRepository(db).list()


@router.put('/regulatory-rules', response_model=RegulatoryRuleRead)
def upsert_regulatory_rule(
    payload: RegulatoryRuleUpsert,
    db: Session = Depends(get_db),
    _: UsuarioModel = Depends(require_roles('admin', 'gestor')),
) -> RegulatoryRuleRead:
    return RegulatoryRuleRepository(db).upsert(
        key=payload.key,
        value=payload.value,
        description=payload.description,
    )

