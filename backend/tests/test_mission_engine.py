from app.database.models import TrechoModel
from app.engine.mission_planning_engine import MissionPlanningEngine


def _trecho(idx: int, iro: float, km_ini: float, km_fim: float) -> TrechoModel:
    return TrechoModel(
        id=idx,
        km_inicio=km_ini,
        km_fim=km_fim,
        sentido='N',
        lado='D',
        tipo_area='faixa_dominio',
        nivel_rocada=50,
        latitude=-23.5,
        longitude=-46.6,
        dias_sem_manutencao=10,
        chuva_acumulada_mm=5,
        criticidade_operacional=30,
        risco_contratual=30,
        iro=iro,
        classificacao='Atencao' if iro <= 60 else 'Critico',
        recomendacao_acao='Monitorar',
        recomendacao_prazo_dias=10,
        recomendacao_metodo='Inspecao',
    )


def test_mission_engine_groups_critical_trechos() -> None:
    engine = MissionPlanningEngine()
    trechos = [
        _trecho(1, 80, 10, 11),
        _trecho(2, 75, 11, 12),
        _trecho(3, 65, 12, 13),
        _trecho(4, 20, 13, 14),
        _trecho(5, 72, 14, 15),
    ]

    missions = engine.plan(trechos)

    assert len(missions) >= 1
    assert missions[0].prioridade == 'Alta'
    assert all(m.custo_estimado > 0 for m in missions)
    assert all(m.tempo_estimado_h > 0 for m in missions)
