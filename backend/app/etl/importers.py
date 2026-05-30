from datetime import date, datetime
from pathlib import Path
from zipfile import ZipFile

import geopandas as gpd
import pandas as pd
from fastkml import kml
from shapely.geometry import LineString


class ImportReaders:
    @staticmethod
    def read_csv(path: Path) -> pd.DataFrame:
        return pd.read_csv(path)

    @staticmethod
    def read_xlsx(path: Path) -> pd.DataFrame:
        return pd.read_excel(path, engine='openpyxl')

    @staticmethod
    def read_kml(path: Path) -> gpd.GeoDataFrame:
        return gpd.read_file(path, driver='KML')

    @staticmethod
    def read_kmz(path: Path) -> gpd.GeoDataFrame:
        extract_dir = path.parent / f"_tmp_{path.stem}"
        extract_dir.mkdir(parents=True, exist_ok=True)
        with ZipFile(path, 'r') as archive:
            archive.extractall(extract_dir)
        kml_files = list(extract_dir.glob('**/*.kml'))
        if not kml_files:
            return gpd.GeoDataFrame()
        return gpd.read_file(kml_files[0], driver='KML')

    @staticmethod
    def read_kml_fast(path: Path) -> list[dict]:
        data = path.read_bytes()
        doc = kml.KML()
        doc.from_string(data)
        rows: list[dict] = []
        for feature in doc.features():
            for sub in feature.features():
                rows.append({'name': sub.name})
        return rows


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    mapping = {
        'km_ini': 'km_inicio',
        'km_inicial': 'km_inicio',
        'km_fim': 'km_fim',
        'sent': 'sentido',
        'direcao': 'sentido',
        'side': 'lado',
        'nivel_vegetacao': 'nivel_rocada',
        'data': 'data_referencia',
        'situacao': 'status',
    }
    base = df.rename(columns={k: v for k, v in mapping.items() if k in df.columns}).copy()

    defaults = {
        'km_inicio': 0.0,
        'km_fim': 0.0,
        'sentido': 'N/A',
        'lado': 'N/A',
        'tipo_area': 'faixa_dominio',
        'nivel_rocada': 0.0,
        'data_referencia': pd.Timestamp(datetime.utcnow().date()),
        'status': 'ativo',
        'latitude': -23.5,
        'longitude': -46.6,
        'dias_sem_manutencao': 0,
        'chuva_acumulada_mm': 0.0,
        'criticidade_operacional': 30.0,
        'risco_contratual': 30.0,
    }

    for col, default in defaults.items():
        if col not in base.columns:
            base[col] = default

    base['data_referencia'] = pd.to_datetime(base['data_referencia'], errors='coerce').dt.date.fillna(date.today())

    numeric_cols = [
        'km_inicio', 'km_fim', 'nivel_rocada', 'latitude', 'longitude', 'dias_sem_manutencao',
        'chuva_acumulada_mm', 'criticidade_operacional', 'risco_contratual'
    ]
    for col in numeric_cols:
        base[col] = pd.to_numeric(base[col], errors='coerce').fillna(0)

    return base[[
        'km_inicio', 'km_fim', 'sentido', 'lado', 'tipo_area', 'nivel_rocada', 'data_referencia', 'status',
        'latitude', 'longitude', 'dias_sem_manutencao', 'chuva_acumulada_mm', 'criticidade_operacional', 'risco_contratual'
    ]]


def build_linestring(row: pd.Series) -> LineString:
    offset = 0.01
    start = (float(row['longitude']), float(row['latitude']))
    end = (float(row['longitude']) + offset, float(row['latitude']) + offset)
    return LineString([start, end])
