import type { ComplianceData, DashboardData, DemoDatasetSummary, MissionPlan, RegulatoryRule, RoadSegment, WeeklyPlanData } from '../../domain/types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
const TOKEN_KEY = 'orion_access_token';
const OFFLINE_QUEUE_KEY = 'orion_offline_queue';

type OfflineRequest = {
  path: string;
  method: 'POST' | 'PUT';
  body: unknown;
};

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function enqueueOffline(request: OfflineRequest): void {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? '[]') as OfflineRequest[];
  queue.push(request);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function flushOfflineQueue(): Promise<void> {
  if (!navigator.onLine) return;
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? '[]') as OfflineRequest[];
  if (!queue.length) return;

  const remaining: OfflineRequest[] = [];
  for (const item of queue) {
    try {
      await request(item.path, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });
    } catch {
      remaining.push(item);
    }
  }
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function hasToken(): boolean {
  return Boolean(getToken());
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Sessao expirada. Faca login novamente.');
    throw new Error(`Falha em ${path}`);
  }
  return response.json();
}

export async function login(email: string, password: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/auth/login-json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error('Nao foi possivel conectar na API. Verifique se o backend esta ativo em http://127.0.0.1:8000.');
  }

  if (!response.ok) throw new Error('Falha de autenticacao. Verifique usuario e senha.');

  const payload = (await response.json()) as { access_token: string };
  localStorage.setItem(TOKEN_KEY, payload.access_token);
}

export const getSegments = () => request<RoadSegment[]>('/api/v1/trechos');
export const getMissions = () => request<MissionPlan[]>('/api/v1/missoes');
export const getDashboard = () => request<DashboardData>('/api/v1/dashboard');
export const getCompliance = () => request<ComplianceData>('/api/v1/conformidade');
export const getRegulatoryRules = () => request<RegulatoryRule[]>('/api/v1/config/regulatory-rules');
export const generateDemoDataset = () => request<DemoDatasetSummary>('/api/v1/demo/simulados', { method: 'POST' });
export const resetDemoDataset = () => request<DemoDatasetSummary>('/api/v1/demo/reset', { method: 'POST' });

export async function upsertRegulatoryRule(rule: RegulatoryRule): Promise<RegulatoryRule> {
  if (!navigator.onLine) {
    enqueueOffline({ path: '/api/v1/config/regulatory-rules', method: 'PUT', body: rule });
    return rule;
  }
  return request<RegulatoryRule>('/api/v1/config/regulatory-rules', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  });
}

export async function generateWeeklyPlan(): Promise<WeeklyPlanData> {
  if (!navigator.onLine) {
    enqueueOffline({ path: '/api/v1/plano-semanal/gerar', method: 'POST', body: {} });
    return {
      total_missoes: 0,
      custo_total_estimado: 0,
      economia_logistica_total: 0,
      prioridade_maxima: 'Pendente sync',
      recomendacoes: ['Operacao offline registrada para sincronizacao.'],
    };
  }
  return request<WeeklyPlanData>('/api/v1/plano-semanal/gerar', { method: 'POST' });
}

export const askCopilot = (pergunta: string) =>
  request<{ resposta: string }>('/api/v1/copilot/perguntar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pergunta }),
  });

export async function downloadReport(type: 'operacional' | 'executivo' | 'conformidade'): Promise<void> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}/api/v1/relatorios/${type}`, { headers });
  if (!response.ok) throw new Error('Falha ao gerar relatorio');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_${type}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
