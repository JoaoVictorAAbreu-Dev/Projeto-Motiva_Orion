import type { RoadSegment } from '../domain/types';

export interface DashboardMetrics {
  total_trechos: number;
  trechos_criticos: number;
  missoes_ativas: number;
  economia_estimada: number;
  indice_medio_risco: number;
}

export const toDashboardMetrics = (segments: RoadSegment[]): DashboardMetrics => {
  const trechosCriticos = segments.filter((s) => s.iro >= 70).length;
  const total = segments.length;
  const riscoMedio = total === 0 ? 0 : segments.reduce((acc, s) => acc + s.iro, 0) / total;
  const economiaEstimada = segments.reduce((acc, s) => acc + s.custo_estimado * (s.iro >= 70 ? 0.24 : 0.1), 0);

  return {
    total_trechos: total,
    trechos_criticos: trechosCriticos,
    missoes_ativas: Math.max(1, Math.ceil(trechosCriticos / 3)),
    economia_estimada: Math.round(economiaEstimada),
    indice_medio_risco: Number(riscoMedio.toFixed(1))
  };
};

