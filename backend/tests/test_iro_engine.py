from app.engine.iro_engine import OrionRiskEngine


def test_iro_bounds_and_classification() -> None:
    engine = OrionRiskEngine()

    low = engine.compute_iro(5, 1, 0, 5, 5)
    medium = engine.compute_iro(35, 20, 10, 40, 40)
    high = engine.compute_iro(95, 60, 40, 90, 90)

    assert 0 <= low <= 100
    assert 0 <= medium <= 100
    assert 0 <= high <= 100

    assert engine.classify(low) == 'Normal'
    assert engine.classify(medium) in {'Atencao', 'Critico'}
    assert engine.classify(high) == 'Critico'


def test_iro_monotonic_increase() -> None:
    engine = OrionRiskEngine()
    base = engine.compute_iro(20, 10, 5, 20, 20)
    boosted = engine.compute_iro(60, 30, 25, 60, 60)
    assert boosted > base


def test_ndvi_dense_boost_increases_iro() -> None:
    engine = OrionRiskEngine()
    without_ndvi = engine.compute_iro(40, 10, 12, 30, 30)
    with_dense_ndvi = engine.compute_iro(40, 10, 12, 30, 30, ndvi=0.8)
    assert with_dense_ndvi > without_ndvi


def test_regulatory_height_exceedance_increases_iro() -> None:
    engine = OrionRiskEngine()
    baseline = engine.compute_iro(40, 10, 12, 30, 30, predicted_height_cm=40)
    with_exceedance = engine.compute_iro(
        40,
        10,
        12,
        30,
        30,
        predicted_height_cm=90,
        regulatory_limits_cm={
            'poda_altura_faixa_dominio_cm': 70,
            'poda_altura_entorno_instalacoes_cm': 50,
        },
    )
    assert with_exceedance > baseline
