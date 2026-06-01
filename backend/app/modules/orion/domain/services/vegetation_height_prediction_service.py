from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from sklearn.linear_model import LinearRegression

from app.core.settings import settings


class VegetationHeightPredictionService:
    def __init__(self) -> None:
        self.model_path = Path(settings.ai_model_path)
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        self.model = self._load_or_train_model()

    def _load_or_train_model(self) -> LinearRegression:
        if self.model_path.exists():
            return joblib.load(self.model_path)

        # Synthetic baseline until labeled field data is persisted.
        x = np.array([
            [0.15, 5.0, 8.0],
            [0.22, 12.0, 20.0],
            [0.38, 20.0, 35.0],
            [0.52, 30.0, 50.0],
            [0.67, 40.0, 65.0],
            [0.79, 55.0, 78.0],
        ])
        y = np.array([18.0, 32.0, 47.0, 63.0, 86.0, 104.0])

        model = LinearRegression()
        model.fit(x, y)
        joblib.dump(model, self.model_path)
        return model

    def predict_height_cm(self, ndvi: float, chuva_acumulada_mm: float, dias_sem_manutencao: int) -> float:
        features = np.array([[ndvi, chuva_acumulada_mm, float(dias_sem_manutencao)]], dtype=float)
        prediction = float(self.model.predict(features)[0])
        return round(max(0.0, prediction), 1)

