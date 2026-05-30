import type {
  ExecutiveDecisionPanel,
  ImpactMetrics,
  MissionPlan,
  RoadSegment,
  ScenarioMode
} from '../domain/types';

const labelByScenario: Record<ScenarioMode, string> = {
  seguranca: 'Foco em mitigacao imediata de risco operacional',
  economia: 'Foco em eficiencia de custo e concentracao de execucao',
  equipes_reduzidas: 'Foco em continuidade operacional com menos equipes',
  frequencia_alta: 'Foco em prevencao por manutencao recorrente'
};

export function buildExecutivePanel(
  segments: RoadSegment[],
  missions: MissionPlan[],
  scenario: ScenarioMode
): ExecutiveDecisionPanel {
  const critical = segments.filter((s) => s.iro >= 70).length;
  const avgRisk = segments.length
    ? segments.reduce((acc, s) => acc + s.iro, 0) / segments.length
    : 0;

  const situacao = avgRisk >= 70 ? 'Critica' : avgRisk >= 45 ? 'Atencao Elevada' : 'Controlada';
  const economy = missions.reduce((acc, m) => acc + m.custo_estimado * 0.18, 0);

  return {
    situacao_geral: situacao,
    economia_potencial: Math.round(economy),
    trechos_criticos: critical,
    missoes_recomendadas: missions.length,
    recomendacao_principal: `${labelByScenario[scenario]}. Priorizar missoes ${missions
      .slice(0, 2)
      .map((m) => m.id)
      .join(' e ')}.`
  };
}

export function calculateImpact(
  segments: RoadSegment[],
  missions: MissionPlan[],
  scenario: ScenarioMode
): ImpactMetrics {
  const baseRisk = segments.length
    ? segments.reduce((acc, s) => acc + s.iro, 0) / segments.length
    : 0;

  const treatedRisk = missions.reduce((acc, mission) => acc + mission.criticidade_media, 0);
  const reductionRaw = baseRisk === 0 ? 0 : Math.min(65, (treatedRisk / (missions.length || 1)) * 0.42);

  const scenarioFactor: Record<ScenarioMode, number> = {
    seguranca: 1.2,
    economia: 0.85,
    equipes_reduzidas: 0.75,
    frequencia_alta: 1.1
  };

  const reduction = Math.min(72, reductionRaw * scenarioFactor[scenario]);
  const compliance = Math.min(98, 62 + reduction * 0.45 + missions.length * 2.3);

  return {
    economia_prevista: Math.round(missions.reduce((acc, m) => acc + m.custo_estimado * 0.14, 0)),
    reducao_risco_percentual: Number(reduction.toFixed(1)),
    conformidade_estimada_percentual: Number(compliance.toFixed(1))
  };
}
