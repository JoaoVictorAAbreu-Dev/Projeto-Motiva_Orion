from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import IntervencaoModel, IndicadorModel, MissaoModel, TrechoModel


class TrechoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> List[TrechoModel]:
        return list(self.db.execute(select(TrechoModel).order_by(TrechoModel.iro.desc())).scalars().all())

    def list_criticos(self) -> List[TrechoModel]:
        return list(
            self.db.execute(
                select(TrechoModel).where(TrechoModel.classificacao == 'Critico').order_by(TrechoModel.iro.desc())
            ).scalars().all()
        )

    def get(self, trecho_id: int) -> TrechoModel | None:
        return self.db.get(TrechoModel, trecho_id)

    def bulk_upsert(self, trechos: List[TrechoModel]) -> None:
        for trecho in trechos:
            self.db.merge(trecho)
        self.db.commit()


class IndicadorRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> List[IndicadorModel]:
        return list(self.db.execute(select(IndicadorModel).order_by(IndicadorModel.data_referencia.desc())).scalars().all())


class MissaoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> List[MissaoModel]:
        return list(self.db.execute(select(MissaoModel).order_by(MissaoModel.created_at.desc())).scalars().all())

    def replace_all(self, missoes: List[MissaoModel]) -> None:
        self.db.query(MissaoModel).delete()
        self.db.add_all(missoes)
        self.db.commit()


class IntervencaoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def count(self) -> int:
        return self.db.query(IntervencaoModel).count()
