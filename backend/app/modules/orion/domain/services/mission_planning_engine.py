from datetime import datetime

from app.modules.orion.application.services.route_service import OpenRouteService
from app.database.models import MissaoModel, TrechoModel


class MissionPlanningEngine:
    def __init__(self, route_service: OpenRouteService | None = None) -> None:
        self.route_service = route_service

    def plan(self, trechos: list[TrechoModel]) -> list[MissaoModel]:
        prioritized = sorted([t for t in trechos if t.iro >= 45], key=lambda t: t.iro, reverse=True)
        missions: list[MissaoModel] = []

        for index in range(0, len(prioritized), 3):
            chunk = prioritized[index:index + 3]
            if not chunk:
                continue

            max_iro = max(t.iro for t in chunk)
            prioridade = 'Alta' if max_iro >= 70 else 'Media'
            equipe = 'Equipe Norte' if index % 2 == 0 else 'Equipe Sul'
            base_cost = sum(1200 + (t.iro * 12) for t in chunk)
            distancia = max(1.0, (chunk[-1].km_fim - chunk[0].km_inicio))
            tempo_h = round(len(chunk) * 1.35 + distancia * 0.3, 1)

            # Optional ORS enrichment with strict fallback and call cap.
            if self.route_service and len(chunk) >= 2:
                route = self.route_service.estimate_pair(
                    chunk[0].latitude,
                    chunk[0].longitude,
                    chunk[-1].latitude,
                    chunk[-1].longitude,
                )
                if route:
                    distancia = max(distancia, route.distance_km)
                    tempo_h = round(max(tempo_h, route.duration_h + len(chunk) * 0.9), 1)

            economia = round(base_cost * 0.12 + (distancia * 18), 2)

            missions.append(
                MissaoModel(
                    codigo=f"MIS-{index // 3 + 1:03d}",
                    prioridade=prioridade,
                    equipe=equipe,
                    tempo_estimado_h=tempo_h,
                    custo_estimado=round(base_cost, 2),
                    economia_logistica_estimada=economia,
                    trecho_ids=[t.id for t in chunk],
                    plano_semanal_ref=f"{datetime.utcnow():%Y-W%W}",
                )
            )

        return missions

