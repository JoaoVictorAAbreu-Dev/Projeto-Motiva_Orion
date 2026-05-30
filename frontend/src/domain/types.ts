export type SegmentStatus = 'normal' | 'critical' | 'attention';

export interface RoadSegment {
  id: number;
  km_inicio: number;
  km_fim: number;
  latitude: number;
  longitude: number;
  nivel_vegetacao: number;
  dias_sem_rocada: number;
  chuva_prevista_mm: number;
  trafego_estimado: number;
  risco_contratual: number;
  custo_estimado: number;
  status: SegmentStatus;
  iro: number;
}

export interface MissionPlan {
  id: string;
  segment_ids: number[];
  centroid: { lat: number; lng: number };
  tempo_estimado_h: number;
  custo_estimado: number;
  criticidade_media: number;
}

export type ScenarioMode = 'seguranca' | 'economia' | 'equipes_reduzidas' | 'frequencia_alta';

export interface ExecutiveDecisionPanel {
  situacao_geral: string;
  economia_potencial: number;
  trechos_criticos: number;
  missoes_recomendadas: number;
  recomendacao_principal: string;
}

export interface ImpactMetrics {
  economia_prevista: number;
  reducao_risco_percentual: number;
  conformidade_estimada_percentual: number;
}
