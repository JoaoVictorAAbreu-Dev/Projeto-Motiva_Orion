from pathlib import Path

from sqlalchemy.orm import Session

from app.modules.orion.application.services.etl_pipeline_service import ETLPipelineService
from app.modules.orion.application.services.route_service import OpenRouteService
from app.database.models import IndicadorModel
from app.modules.orion.domain.services.mission_planning_engine import MissionPlanningEngine
from app.modules.orion.infrastructure.persistence.core_repositories import IndicadorRepository, MissaoRepository, TrechoRepository


class OperationalBootstrapService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.etl = ETLPipelineService(db)
        self.mission_engine = MissionPlanningEngine(route_service=OpenRouteService())

    async def _persist(self, files: list[Path]) -> dict:
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

    async def load_from_raw(self, raw_dir: Path) -> dict:
        files = [*raw_dir.glob('*.csv'), *raw_dir.glob('*.xlsx'), *raw_dir.glob('*.kml'), *raw_dir.glob('*.kmz')]
        return await self._persist(files)

    async def load_from_paths(self, paths: list[Path]) -> dict:
        files = [p for p in paths if p.exists() and p.suffix.lower() in {'.csv', '.xlsx', '.kml', '.kmz'}]
        return await self._persist(files)

