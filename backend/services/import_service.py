import csv
import json
from pathlib import Path

from domains.trecho import Trecho
from services.iro_service import IROService


class ImportService:
    def __init__(self, base_path: Path | None = None) -> None:
        self.base_path = base_path or Path(__file__).resolve().parents[1]
        self.raw_path = self.base_path / 'data' / 'raw'
        self.processed_path = self.base_path / 'data' / 'processed'

    def _parse_csv(self, filename: str) -> list[Trecho]:
        file_path = self.raw_path / filename
        if not file_path.exists() or file_path.stat().st_size == 0:
            return []

        trechos: list[Trecho] = []
        with file_path.open('r', encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                trecho = Trecho(
                    id=int(row['id']),
                    km_inicio=float(row['km_inicio']),
                    km_fim=float(row['km_fim']),
                    latitude=float(row['latitude']),
                    longitude=float(row['longitude']),
                    nivel_vegetacao=float(row['nivel_vegetacao']),
                    dias_sem_rocada=int(row['dias_sem_rocada']),
                    chuva_prevista_mm=float(row['chuva_prevista_mm']),
                    trafego_estimado=int(row['trafego_estimado']),
                    risco_contratual=float(row['risco_contratual']),
                    custo_estimado=float(row['custo_estimado']),
                )
                iro = IROService.calcular(trecho)
                trecho.iro = iro.valor
                trecho.status = iro.classificacao
                trechos.append(trecho)
        return trechos

    def processar(self) -> dict:
        trechos = self._parse_csv('rocada_2024.csv') + self._parse_csv('rocada_2025.csv')

        self.processed_path.mkdir(parents=True, exist_ok=True)
        trechos_payload = [t.__dict__ for t in trechos]
        historico_payload = {
            'total_trechos': len(trechos_payload),
            'indice_medio_risco': round(sum(t['iro'] for t in trechos_payload) / len(trechos_payload), 1) if trechos_payload else 0,
        }

        (self.processed_path / 'trechos.json').write_text(json.dumps(trechos_payload, ensure_ascii=False, indent=2), encoding='utf-8')
        (self.processed_path / 'historico.json').write_text(json.dumps(historico_payload, ensure_ascii=False, indent=2), encoding='utf-8')

        return historico_payload
