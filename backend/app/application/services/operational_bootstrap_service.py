from pathlib import Path

from sqlalchemy.orm import Session

from app.application.services.etl_pipeline_service import ETLPipelineService
from app.database.models import IndicadorModel
from app.engine.mission_planning_engine import MissionPlanningEngine
from app.repositories.core_repositories import IndicadorRepository, MissaoRepository, TrechoRepository


class OperationalBootstrapService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.etl = ETLPipelineService()
        self.mission_engine = MissionPlanningEngine()

    async def load_from_raw(self, raw_dir: Path) -> dict:
        files = [*raw_dir.glob('*.csv'), *raw_dir.glob('*.xlsx'), *raw_dir.glob('*.kml'), *raw_dir.glob('*.kmz')]
        trechos = await self.etl.import_files(files)

        trecho_repo = TrechoRepository(self.db)
        indicador_repo = IndicadorRepository(self.db)
        missao_repo = MissaoRepository(self.db)

        trecho_repo.bulk_upsert(trechos)

        self.db.query(IndicadorModel).delete()
        self.db.add(self.etl.build_indicador(trechos))
        self.db.commit()

        missions = self.mission_engine.plan(trechos)
        missao_repo.replace_all(missions)

        return {
            'files_processed': len(files),
            'trechos_loaded': len(trechos),
            'missoes_generated': len(missions),
            'indicadores': len(indicador_repo.list()),
        }
