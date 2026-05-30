from datetime import datetime, timezone

from app.domain.models import MissionPlan, OperationalContext, RoadSegment
from app.infrastructure.external.geo_client import GeoClient
from app.infrastructure.external.open_meteo_client import OpenMeteoClient
from app.infrastructure.external.route_client import RouteClient
from app.infrastructure.external.satellite_client import SatelliteClient
from app.infrastructure.repository import load_segments


class DecisionContextService:
    def __init__(self) -> None:
        self.weather_client = OpenMeteoClient()
        self.geo_client = GeoClient()
        self.satellite_client = SatelliteClient()
        self.route_client = RouteClient()

    def _build_missions(self, segments: list[RoadSegment]) -> list[MissionPlan]:
        critical = [s for s in segments if s.iro >= 60]
        missions: list[MissionPlan] = []
        for i in range(0, len(critical), 3):
            chunk = critical[i : i + 3]
            if not chunk:
                continue
            missions.append(
                MissionPlan(
                    id=f"M-{(i // 3) + 1:02d}",
                    segment_ids=[s.id for s in chunk],
                    tempo_estimado_h=round(len(chunk) * 1.6, 1),
                    custo_estimado=round(sum(s.custo_estimado for s in chunk), 2),
                    criticidade_media=round(sum(s.iro for s in chunk) / len(chunk), 1),
                )
            )
        return missions

    async def get_context(self, scenario: str) -> OperationalContext:
        segments = load_segments()
        missions = self._build_missions(segments)
        critical = [s for s in segments if s.iro >= 70]
        avg_iro = round(sum(s.iro for s in segments) / max(1, len(segments)), 1)

        ref = segments[0]
        weather = await self.weather_client.get_forecast(ref.latitude, ref.longitude)
        geo = await self.geo_client.reverse_geocode(ref.latitude, ref.longitude)
        overpass = await self.geo_client.highway_context(ref.latitude, ref.longitude)
        satellite = await self.satellite_client.get_vegetation_signal(ref.latitude, ref.longitude)
        route_matrix = await self.route_client.matrix([[s.longitude, s.latitude] for s in segments[:4]])

        weather_summary = {
            **weather,
            'localizacao_referencia': geo.get('display_name'),
            'vias_proximas': overpass.get('nearby_roads', []),
            'vegetacao_satelite': satellite,
            'logistica': route_matrix,
        }

        return OperationalContext(
            scenario=scenario,
            generated_at=datetime.now(timezone.utc).isoformat(),
            total_segments=len(segments),
            critical_segments=len(critical),
            average_iro=avg_iro,
            total_estimated_cost=round(sum(m.custo_estimado for m in missions), 2),
            weather_summary=weather_summary,
            top_priorities=sorted(segments, key=lambda s: s.iro, reverse=True)[:5],
            recommended_missions=missions,
        )
