from datetime import date
from pathlib import Path

from geoalchemy2.shape import from_shape
import pandas as pd

from app.application.services.weather_service import WeatherService
from app.database.models import IndicadorModel, TrechoModel
from app.engine.growth_service import GrowthService
from app.engine.iro_engine import OrionRiskEngine
from app.engine.recommendation_service import RecommendationService
from app.etl.importers import ImportReaders, build_linestring, normalize_dataframe


class ETLPipelineService:
    def __init__(self) -> None:
        self.reader = ImportReaders()
        self.iro_engine = OrionRiskEngine()
        self.growth = GrowthService()
        self.recommendation = RecommendationService()
        self.weather = WeatherService()

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

        for idx, row in unified.iterrows():
            weather = await self.weather.get_weather(float(row['latitude']), float(row['longitude']))
            climate_boost = self.weather.climate_risk_boost(weather['chuva_mm_3d'], weather['umidade_media_24h'])
            chuva_operacional = float(row['chuva_acumulada_mm']) + weather['chuva_mm_3d']

            iro_base = self.iro_engine.compute_iro(
                nivel_rocada=float(row['nivel_rocada']),
                dias_sem_manutencao=int(row['dias_sem_manutencao']),
                chuva_acumulada_mm=chuva_operacional,
                criticidade_operacional=float(row['criticidade_operacional']),
                risco_contratual=float(row['risco_contratual']),
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
                    data_referencia=row['data_referencia'] if isinstance(row['data_referencia'], date) else date.today(),
                    status=str(row['status']),
                    latitude=float(row['latitude']),
                    longitude=float(row['longitude']),
                    geom=from_shape(build_linestring(row), srid=4326),
                    dias_sem_manutencao=int(row['dias_sem_manutencao']),
                    chuva_acumulada_mm=chuva_operacional,
                    criticidade_operacional=float(row['criticidade_operacional']),
                    risco_contratual=float(row['risco_contratual']),
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
