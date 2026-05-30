import type { ComplianceData, DashboardData, MissionPlan, RoadSegment, WeeklyPlanData } from '../../domain/types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`Falha em ${path}`);
  }
  return response.json();
}

export const getSegments = () => request<RoadSegment[]>('/api/v1/trechos');
export const getMissions = () => request<MissionPlan[]>('/api/v1/missoes');
export const getDashboard = () => request<DashboardData>('/api/v1/dashboard');
export const getCompliance = () => request<ComplianceData>('/api/v1/conformidade');
export const generateWeeklyPlan = () => request<WeeklyPlanData>('/api/v1/plano-semanal/gerar', { method: 'POST' });

export async function downloadReport(type: 'operacional' | 'executivo' | 'conformidade'): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/relatorios/${type}`);
  if (!response.ok) {
    throw new Error('Falha ao gerar relatorio');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_${type}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
