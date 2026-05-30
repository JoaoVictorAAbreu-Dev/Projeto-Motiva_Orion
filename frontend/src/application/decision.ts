import type {
  DashboardData,
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
  scenario: ScenarioMode,
  dashboard: DashboardData | null
): ExecutiveDecisionPanel {
  const critical = dashboard?.trechos_criticos ?? segments.filter((s) => s.iro >= 70).length;
  const avgRisk = dashboard?.indice_medio_risco ?? (segments.length ? segments.reduce((acc, s) => acc + s.iro, 0) / segments.length : 0);
  const situacao = avgRisk >= 70 ? 'Critica' : avgRisk >= 45 ? 'Atencao Elevada' : 'Controlada';
  const economy = dashboard?.economia_potencial ?? missions.reduce((acc, m) => acc + m.custo_estimado * 0.18, 0);
  const conformidade = dashboard?.conformidade_contratual ?? Math.max(0, 100 - critical * 4.5);

  return {
    situacao_geral: situacao,
    economia_potencial: Math.round(economy),
    trechos_criticos: critical,
    missoes_recomendadas: dashboard?.missoes_planejadas ?? missions.length,
    conformidade_contratual: Number(conformidade.toFixed(1)),
    recomendacao_principal: `${labelByScenario[scenario]}. Priorizar missoes ${missions
      .slice(0, 2)
      .map((m) => m.codigo)
      .join(' e ')}.`
  };
}

export function calculateImpact(
  segments: RoadSegment[],
  missions: MissionPlan[],
  scenario: ScenarioMode
): ImpactMetrics {
  const baseRisk = segments.length ? segments.reduce((acc, s) => acc + s.iro, 0) / segments.length : 0;
  const treatedRisk = missions.reduce((acc, mission) => acc + mission.tempo_estimado_h, 0);
  const reductionRaw = baseRisk === 0 ? 0 : Math.min(65, treatedRisk * 0.9);

  const scenarioFactor: Record<ScenarioMode, number> = {
    seguranca: 1.2,
    economia: 0.85,
    equipes_reduzidas: 0.75,
    frequencia_alta: 1.1
  };

  const reduction = Math.min(72, reductionRaw * scenarioFactor[scenario]);
  const compliance = Math.min(98, 62 + reduction * 0.45 + missions.length * 2.3);

  return {
    economia_prevista: Math.round(missions.reduce((acc, m) => acc + m.economia_logistica_estimada, 0)),
    reducao_risco_percentual: Number(reduction.toFixed(1)),
    conformidade_estimada_percentual: Number(compliance.toFixed(1)),
    impacto_contratual: Number((100 - compliance).toFixed(1))
  };
}
