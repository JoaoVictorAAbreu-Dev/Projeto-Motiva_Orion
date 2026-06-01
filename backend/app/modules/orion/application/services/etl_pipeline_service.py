from datetime import date
from pathlib import Path

from geoalchemy2.shape import from_shape
import pandas as pd
from sqlalchemy.orm import Session

from app.modules.orion.application.services.weather_service import WeatherService
from app.database.models import IndicadorModel, TrechoModel
from app.modules.orion.domain.services.growth_service import GrowthService
from app.modules.orion.domain.services.iro_engine import OrionRiskEngine
from app.modules.orion.domain.services.recommendation_service import RecommendationService
from app.modules.orion.domain.services.vegetation_height_prediction_service import VegetationHeightPredictionService
from app.etl.importers import ImportReaders, build_linestring, normalize_dataframe
from app.modules.orion.infrastructure.satellite.satellite_service import SentinelSatelliteService
from app.modules.orion.infrastructure.persistence.core_repositories import RegulatoryRuleRepository


class ETLPipelineService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.reader = ImportReaders()
        self.iro_engine = OrionRiskEngine()
        self.growth = GrowthService()
        self.recommendation = RecommendationService()
        self.weather = WeatherService()
        self.height_prediction = VegetationHeightPredictionService()
        self.satellite = SentinelSatelliteService()
        self.regulatory_repo = RegulatoryRuleRepository(db)
        self._weather_cache: dict[tuple[float, float], dict] = {}
        self._ndvi_cache: dict[tuple[float, float], float | None] = {}

    def _read_path(self, path: Path):
        ext = path.suffix.lower()
        if ext == '.csv':
            return self.reader.read_csv(path)
        if ext in {'.xlsx', '.xlsm'}:
            return self.reader.read_xlsx(path)
        if ext == '.kml':
            gdf = self.reader.read_kml(path)
            return gdf.drop(columns=['geometry'], errors='ignore')
        if ext == '.kmz':
            gdf = self.reader.read_kmz(path)
            return gdf.drop(columns=['geometry'], errors='ignore')
        return None

    async def _get_weather_cached(self, latitude: float, longitude: float) -> dict:
        key = (round(latitude, 2), round(longitude, 2))
        if key not in self._weather_cache:
            self._weather_cache[key] = await self.weather.get_weather(latitude, longitude)
        return self._weather_cache[key]

    async def _get_ndvi_cached(self, latitude: float, longitude: float, ref_date: date) -> float | None:
        key = (round(latitude, 4), round(longitude, 4))
        if key in self._ndvi_cache:
            return self._ndvi_cache[key]

        delta = 0.005
        bbox = [longitude - delta, latitude - delta, longitude + delta, latitude + delta]
        day = ref_date.isoformat()
        try:
            ndvi = await self.satellite.get_ndvi_mean(bbox=bbox, date_from=day, date_to=day)
        except Exception:
            ndvi = None
        self._ndvi_cache[key] = ndvi
        return ndvi

    async def import_files(self, files: list[Path]) -> list[TrechoModel]:
        frames = []
        for path in files:
            data = self._read_path(path)
            if data is not None:
                frames.append(data)

        if not frames:
            return []

        unified = normalize_dataframe(pd.concat(frames, ignore_index=True))
        trechos: list[TrechoModel] = []
        regulatory_limits = self.regulatory_repo.get_map()

        for idx, row in unified.iterrows():
            latitude = float(row['latitude'])
            longitude = float(row['longitude'])
            data_ref = row['data_referencia'] if isinstance(row['data_referencia'], date) else date.today()
            weather = await self._get_weather_cached(latitude, longitude)
            ndvi = await self._get_ndvi_cached(latitude, longitude, data_ref)

            climate_boost = self.weather.climate_risk_boost(weather['chuva_mm_3d'], weather['umidade_media_24h'])
            chuva_operacional = float(row['chuva_acumulada_mm']) + weather['chuva_mm_3d']
            altura_predita = self.height_prediction.predict_height_cm(ndvi or 0.0, chuva_operacional, int(row['dias_sem_manutencao']))

            iro_base = self.iro_engine.compute_iro(
                nivel_rocada=float(row['nivel_rocada']),
                dias_sem_manutencao=int(row['dias_sem_manutencao']),
                chuva_acumulada_mm=chuva_operacional,
                criticidade_operacional=float(row['criticidade_operacional']),
                risco_contratual=float(row['risco_contratual']),
                ndvi=ndvi,
                predicted_height_cm=altura_predita,
                regulatory_limits_cm=regulatory_limits,
            )
            iro = min(100.0, round(iro_base + climate_boost, 1))
            classe = self.iro_engine.classify(iro)
            crescimento = self.growth.estimate_growth(float(row['nivel_rocada']), chuva_operacional, int(row['dias_sem_manutencao']))
            acao, prazo, metodo = self.recommendation.recommend(iro, crescimento)

            trechos.append(
                TrechoModel(
                    id=int(idx + 1),
                    km_inicio=float(row['km_inicio']),
                    km_fim=float(row['km_fim']),
                    sentido=str(row['sentido']),
                    lado=str(row['lado']),
                    tipo_area=str(row['tipo_area']),
                    nivel_rocada=float(row['nivel_rocada']),
                    data_referencia=data_ref,
                    status=str(row['status']),
                    latitude=latitude,
                    longitude=longitude,
                    geom=from_shape(build_linestring(row), srid=4326),
                    dias_sem_manutencao=int(row['dias_sem_manutencao']),
                    chuva_acumulada_mm=chuva_operacional,
                    criticidade_operacional=float(row['criticidade_operacional']),
                    risco_contratual=float(row['risco_contratual']),
                    ndvi=ndvi,
                    altura_vegetacao_predita_cm=altura_predita,
                    iro=iro,
                    classificacao=classe,
                    recomendacao_acao=acao,
                    recomendacao_prazo_dias=prazo,
                    recomendacao_metodo=metodo,
                )
            )

        return trechos

    @staticmethod
    def build_indicador(trechos: list[TrechoModel]) -> IndicadorModel:
        total = len(trechos)
        criticos = len([t for t in trechos if t.classificacao == 'Critico'])
        medio = round(sum(t.iro for t in trechos) / total, 1) if total else 0
        economia = round(sum((t.iro * 26) for t in trechos if t.iro >= 45), 2)
        return IndicadorModel(
            data_referencia=date.today(),
            total_trechos=total,
            trechos_criticos=criticos,
            indice_medio_iro=medio,
            economia_potencial=economia,
        )

