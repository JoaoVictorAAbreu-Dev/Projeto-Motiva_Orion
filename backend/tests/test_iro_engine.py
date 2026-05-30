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
