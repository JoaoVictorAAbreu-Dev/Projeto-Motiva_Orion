import type { MissionPlan, RoadSegment, ScenarioMode } from '../domain/types';

interface MissionInput {
  maxRadiusKm: number;
  minIro: number;
  teamFactor: number;
  costFactor: number;
}

const SCENARIO_RULES: Record<ScenarioMode, MissionInput> = {
  seguranca: { maxRadiusKm: 28, minIro: 55, teamFactor: 1, costFactor: 1.12 },
  economia: { maxRadiusKm: 38, minIro: 65, teamFactor: 0.9, costFactor: 0.82 },
  equipes_reduzidas: { maxRadiusKm: 46, minIro: 68, teamFactor: 0.72, costFactor: 0.78 },
  frequencia_alta: { maxRadiusKm: 24, minIro: 45, teamFactor: 1.2, costFactor: 1.18 }
};

const distanceKm = (a: RoadSegment, b: RoadSegment): number => {
  const R = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export function buildMissionsByScenario(
  segments: RoadSegment[],
  scenario: ScenarioMode
): MissionPlan[] {
  const cfg = SCENARIO_RULES[scenario];
  const candidates = [...segments]
    .filter((segment) => segment.iro >= cfg.minIro)
    .sort((a, b) => b.iro - a.iro);

  const used = new Set<number>();
  const missions: MissionPlan[] = [];

  for (const lead of candidates) {
    if (used.has(lead.id)) continue;

    const cluster = [lead];
    used.add(lead.id);

    for (const candidate of candidates) {
      if (used.has(candidate.id)) continue;
      if (cluster.length >= 4) break;
      if (distanceKm(lead, candidate) <= cfg.maxRadiusKm) {
        cluster.push(candidate);
        used.add(candidate.id);
      }
    }

    const cost = cluster.reduce((acc, s) => acc + s.custo_estimado, 0) * cfg.costFactor;
    const avgRisk = cluster.reduce((acc, s) => acc + s.iro, 0) / cluster.length;

    missions.push({
      id: `M-${String(missions.length + 1).padStart(2, '0')}`,
      segment_ids: cluster.map((s) => s.id),
      centroid: {
        lat: cluster.reduce((acc, s) => acc + s.latitude, 0) / cluster.length,
        lng: cluster.reduce((acc, s) => acc + s.longitude, 0) / cluster.length
      },
      tempo_estimado_h: Number((cluster.length * 1.7 * (1 / cfg.teamFactor)).toFixed(1)),
      custo_estimado: Math.round(cost),
      criticidade_media: Number(avgRisk.toFixed(1))
    });
  }

  return missions;
}
