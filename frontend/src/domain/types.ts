export interface RoadSegment {
  id: number;
  km_inicio: number;
  km_fim: number;
  sentido: string;
  lado: string;
  tipo_area: string;
  nivel_rocada: number;
  data_referencia: string | null;
  status: string;
  latitude: number;
  longitude: number;
  dias_sem_manutencao: number;
  chuva_acumulada_mm: number;
  criticidade_operacional: number;
  risco_contratual: number;
  iro: number;
  classificacao: 'Normal' | 'Atencao' | 'Critico';
  recomendacao_acao: string;
  recomendacao_prazo_dias: number;
  recomendacao_metodo: string;
  custo_estimado?: number;
  trafego_estimado?: number;
}

export interface MissionPlan {
  id: number;
  codigo: string;
  prioridade: string;
  equipe: string;
  tempo_estimado_h: number;
  custo_estimado: number;
  economia_logistica_estimada: number;
  trecho_ids: number[];
  plano_semanal_ref: string;
}

export type ScenarioMode = 'seguranca' | 'economia' | 'equipes_reduzidas' | 'frequencia_alta';

export interface ExecutiveDecisionPanel {
  situacao_geral: string;
  economia_potencial: number;
  trechos_criticos: number;
  missoes_recomendadas: number;
  conformidade_contratual: number;
  recomendacao_principal: string;
}

export interface ImpactMetrics {
  economia_prevista: number;
  reducao_risco_percentual: number;
  conformidade_estimada_percentual: number;
  impacto_contratual: number;
}

export interface DashboardData {
  total_trechos: number;
  trechos_criticos: number;
  missoes_planejadas: number;
  economia_potencial: number;
  indice_medio_risco: number;
  conformidade_contratual: number;
}

export interface ComplianceData {
  conformidade_geral: number;
  trechos_risco_contratual: number;
  prazo_medio_restante_dias: number;
  historico_intervencoes: number;
}

export interface WeeklyPlanData {
  total_missoes: number;
  custo_total_estimado: number;
  economia_logistica_total: number;
  prioridade_maxima: string;
  recomendacoes: string[];
}
