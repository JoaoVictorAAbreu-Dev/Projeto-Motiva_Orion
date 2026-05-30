import type { MissionPlan, RoadSegment } from '../domain/types';

const money = (value: number) => `R$ ${value.toLocaleString('pt-BR')}`;

export function askOperationalCopilot(
  question: string,
  segments: RoadSegment[],
  missions: MissionPlan[]
): string {
  const normalized = question.toLowerCase();
  const critical = segments.filter((s) => s.iro >= 70);
  const avgIro = segments.length ? segments.reduce((acc, s) => acc + s.iro, 0) / segments.length : 0;
  const missionCost = missions.reduce((acc, m) => acc + m.custo_estimado, 0);

  if (normalized.includes('prior') || normalized.includes('primeiro')) {
    const ids = critical.slice(0, 3).map((s) => s.id).join(', ');
    return `Prioridade imediata: trechos ${ids}. Justificativa: IRO acima de 70 e maior risco contratual.`;
  }

  if (normalized.includes('custo') || normalized.includes('econom')) {
    return `Custo total recomendado para ciclo atual: ${money(missionCost)}. Economia potencial estimada: ${money(Math.round(missionCost * 0.14))}.`;
  }

  if (normalized.includes('risco') || normalized.includes('seguran')) {
    return `Risco medio atual: ${avgIro.toFixed(1)} IRO. Executar ${missions.length} missoes reduz risco operacional previsto em ~${Math.min(70, (missions.length * 6.5)).toFixed(1)}%.`;
  }

  return `Decisao sugerida: executar ${missions.length} missoes em ondas de 2 frentes. Comecar por corredores com IRO >= 70 e chuva prevista alta para reduzir risco e evitar custo corretivo.`;
}
