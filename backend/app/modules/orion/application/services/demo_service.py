from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from random import Random

from app.database.models import IndicadorModel, MissaoModel, TrechoModel


@dataclass(frozen=True)
class DemoTrechoInput:
    km_inicio: float
    km_fim: float
    sentido: str
    lado: str
    tipo_vegetacao: str
    dias_sem_manutencao: int
    chuva_recente_mm: float
    umidade_percentual: float
    recorrencia: int
    risco_visual_manual: int
    latitude: float
    longitude: float


VEGETATION_WEIGHTS = {
    'graminea': 8,
    'arbustiva': 14,
    'mista': 20,
    'densa': 26,
}


def classify_score(score: float) -> str:
    if score >= 70:
        return 'alto'
    if score >= 40:
        return 'medio'
    return 'baixo'


def recommendation_for(score: float) -> str:
    if score >= 70:
        return 'rocar com urgencia'
    if score >= 40:
        return 'rocar em breve'
    return 'inspecionar'


def calculate_priority_score(payload: DemoTrechoInput) -> float:
    vegetation = VEGETATION_WEIGHTS.get(payload.tipo_vegetacao, 12)
    score = (
        payload.dias_sem_manutencao * 0.45
        + payload.chuva_recente_mm * 0.18
        + payload.umidade_percentual * 0.12
        + payload.recorrencia * 5.0
        + payload.risco_visual_manual * 0.35
        + vegetation
    )
    return round(max(0.0, min(100.0, score)), 1)


def build_demo_inputs(count: int = 12, seed: int = 42) -> list[DemoTrechoInput]:
    rng = Random(seed)
    types = ['graminea', 'arbustiva', 'mista', 'densa']
    inputs: list[DemoTrechoInput] = []

    for index in range(count):
        km_inicio = 100 + index * 8.5
        km_fim = km_inicio + 2.8
        tipo = types[index % len(types)]
        dias = 3 + index * 4 + rng.randint(0, 6)
        chuva = round(rng.uniform(0, 42), 1)
        umidade = round(rng.uniform(38, 92), 1)
        recorrencia = rng.randint(0, 5)
        risco = rng.randint(10, 95)
        latitude = -23.6 + index * 0.06
        longitude = -46.8 + index * 0.05
        inputs.append(
            DemoTrechoInput(
                km_inicio=km_inicio,
                km_fim=km_fim,
                sentido='Norte' if index % 2 == 0 else 'Sul',
                lado='Direito' if index % 2 == 0 else 'Esquerdo',
                tipo_vegetacao=tipo,
                dias_sem_manutencao=dias,
                chuva_recente_mm=chuva,
                umidade_percentual=umidade,
                recorrencia=recorrencia,
                risco_visual_manual=risco,
                latitude=latitude,
                longitude=longitude,
            )
        )

    return inputs


def build_demo_trechos() -> list[TrechoModel]:
    today = date.today()
    trechos: list[TrechoModel] = []

    for idx, payload in enumerate(build_demo_inputs(), start=1):
        score = calculate_priority_score(payload)
        trechos.append(
            TrechoModel(
                id=idx,
                km_inicio=payload.km_inicio,
                km_fim=payload.km_fim,
                sentido=payload.sentido,
                lado=payload.lado,
                tipo_area=payload.tipo_vegetacao,
                nivel_rocada=payload.risco_visual_manual,
                data_referencia=today,
                status='ativo',
                latitude=payload.latitude,
                longitude=payload.longitude,
                geom=None,
                dias_sem_manutencao=payload.dias_sem_manutencao,
                chuva_acumulada_mm=payload.chuva_recente_mm,
                criticidade_operacional=payload.umidade_percentual,
                risco_contratual=payload.recorrencia * 10 + payload.risco_visual_manual * 0.5,
                ndvi=round(max(0.05, min(0.95, 1 - payload.umidade_percentual / 120)), 2),
                altura_vegetacao_predita_cm=round(18 + payload.dias_sem_manutencao * 1.6 + payload.chuva_recente_mm * 0.4, 1),
                iro=score,
                classificacao=classify_score(score).capitalize(),
                recomendacao_acao=recommendation_for(score),
                recomendacao_prazo_dias=7 if score >= 70 else 14 if score >= 40 else 30,
                recomendacao_metodo='rocada mecanizada' if score >= 70 else 'inspecao visual' if score < 40 else 'rocada seletiva',
            )
        )

    return trechos


def build_demo_missoes(trechos: list[TrechoModel]) -> list[MissaoModel]:
    ordered = sorted(trechos, key=lambda item: item.iro, reverse=True)
    missions: list[MissaoModel] = []
    for index in range(0, len(ordered), 3):
        chunk = ordered[index:index + 3]
        if not chunk:
            continue
        avg = sum(t.iro for t in chunk) / len(chunk)
        missions.append(
            MissaoModel(
                codigo=f'DEMO-{index // 3 + 1:03d}',
                prioridade='Alta' if avg >= 70 else 'Media',
                equipe='Equipe Norte' if index % 2 == 0 else 'Equipe Sul',
                tempo_estimado_h=round(len(chunk) * 1.6, 1),
                custo_estimado=round(sum(850 + t.iro * 9 for t in chunk), 2),
                economia_logistica_estimada=round(sum(120 + t.iro * 1.3 for t in chunk), 2),
                trecho_ids=[t.id for t in chunk],
                plano_semanal_ref='DEMO',
            )
        )
    return missions


def build_indicador(trechos: list[TrechoModel]) -> IndicadorModel:
    total = len(trechos)
    criticos = len([t for t in trechos if t.iro >= 70])
    media = round(sum(t.iro for t in trechos) / total, 1) if total else 0
    economia = round(sum(t.recomendacao_prazo_dias for t in trechos if t.iro >= 40) * 18.5, 2)
    return IndicadorModel(
        data_referencia=date.today(),
        total_trechos=total,
        trechos_criticos=criticos,
        indice_medio_iro=media,
        economia_potencial=economia,
    )
