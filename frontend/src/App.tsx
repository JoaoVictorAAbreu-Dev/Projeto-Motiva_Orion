import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Database,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Radar,
  RefreshCcw,
  Sparkles,
  X
} from 'lucide-react';
import { buildExecutivePanel, calculateImpact } from './application/decision';
import { buildMissionsByScenario } from './application/missions';
import type { ComplianceData, DashboardData, DemoDatasetSummary, MissionPlan, RegulatoryRule, RoadSegment, ScenarioMode, WeeklyPlanData } from './domain/types';
import { askCopilot, clearToken, downloadReport, flushOfflineQueue, generateDemoDataset, generateWeeklyPlan, getCompliance, getDashboard, getMissions, getRegulatoryRules, getSegments, hasToken, login, resetDemoDataset, upsertRegulatoryRule } from './infrastructure/api/segments.api';
import { CompliancePanel } from './ui/modules/dashboard/CompliancePanel';
import { ExecutivePanel } from './ui/modules/dashboard/ExecutivePanel';
import { RegulatorySettingsPanel } from './ui/modules/dashboard/RegulatorySettingsPanel';
import { ScenarioSimulator } from './ui/modules/dashboard/ScenarioSimulator';
import { OperationalMap } from './ui/modules/map/OperationalMap';
import { MissionPlanning } from './ui/modules/missions/MissionPlanning';
import { PriorityRanking } from './ui/modules/ranking/PriorityRanking';
import { TrechoDetail } from './ui/modules/ranking/TrechoDetail';
import { CopilotPanel } from './ui/modules/reports/CopilotPanel';
import { ImpactPanel } from './ui/modules/reports/ImpactPanel';

type SectionId = 'executivo' | 'cenario' | 'mapa' | 'missoes';

const sections = [
  { id: 'executivo', label: 'Executive', subtitle: 'Overview', icon: LayoutDashboard },
  { id: 'cenario', label: 'Scenario', subtitle: 'Simulation', icon: BarChart3 },
  { id: 'mapa', label: 'Map', subtitle: 'Ranking view', icon: Map },
  { id: 'missoes', label: 'Actions', subtitle: 'Plans and reports', icon: ClipboardList }
] satisfies Array<{ id: SectionId; label: string; subtitle: string; icon: typeof LayoutDashboard }>;

function App() {
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [missions, setMissions] = useState<MissionPlan[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [regulatoryRules, setRegulatoryRules] = useState<RegulatoryRule[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanData | null>(null);
  const [demoSummary, setDemoSummary] = useState<DemoDatasetSummary | null>(null);
  const [loading, setLoading] = useState(hasToken());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioMode>('seguranca');
  const [activeSection, setActiveSection] = useState<SectionId>('executivo');
  const [selectedTrechoId, setSelectedTrechoId] = useState<number | null>(null);
  const [email, setEmail] = useState('admin@motiva-orion.local');
  const [password, setPassword] = useState('orion.admin.123');
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [segmentsData, missionsData, dashboardData, complianceData, rulesData] = await Promise.all([
      getSegments(),
      getMissions(),
      getDashboard(),
      getCompliance(),
      getRegulatoryRules()
    ]);

    setError(null);
    setSegments(segmentsData);
    setMissions(missionsData);
    setDashboard(dashboardData);
    setCompliance(complianceData);
    setRegulatoryRules(rulesData);
    if (segmentsData.length > 0) setSelectedTrechoId((current) => current ?? segmentsData[0].id);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const sync = () => {
      void flushOfflineQueue();
    };
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const syncOperation = async () => {
      try {
        await loadData();
      } catch (requestError) {
        if (!active) return;
        const message = (requestError as Error).message;
        if (message.includes('Sessao expirada')) {
          clearToken();
          setIsAuthenticated(false);
        }
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };
    queueMicrotask(() => {
      if (active) void syncOperation();
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActiveSection(visible[0].target.id as SectionId);
      },
      { threshold: [0.2, 0.45], rootMargin: '-100px 0px -45% 0px' }
    );
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [isAuthenticated]);

  const scenarioMissions = useMemo(() => buildMissionsByScenario(segments, scenario), [segments, scenario]);
  const executivePanel = useMemo(() => buildExecutivePanel(segments, missions, scenario, dashboard), [segments, missions, scenario, dashboard]);
  const impact = useMemo(() => calculateImpact(segments, scenarioMissions, scenario), [segments, scenarioMissions, scenario]);
  const selectedTrecho = useMemo(() => segments.find((segment) => segment.id === selectedTrechoId) ?? null, [segments, selectedTrechoId]);

  const goToSection = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  const refreshData = async () => {
    try {
      setError(null);
      await loadData();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const onGeneratePlan = async () => {
    try {
      setBusy(true);
      setError(null);
      setWeeklyPlan(await generateWeeklyPlan());
      await loadData();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onGenerateDemo = async () => {
    try {
      setBusy(true);
      setError(null);
      const summary = await generateDemoDataset();
      setDemoSummary(summary);
      await loadData();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onResetDemo = async () => {
    try {
      setBusy(true);
      setError(null);
      const summary = await resetDemoDataset();
      setDemoSummary(summary);
      await loadData();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await login(email, password);
      setIsAuthenticated(true);
    } catch (requestError) {
      setError((requestError as Error).message);
      setLoading(false);
    }
  };

  const onLogout = () => {
    clearToken();
    setIsAuthenticated(false);
    setSegments([]);
    setMissions([]);
    setDashboard(null);
    setCompliance(null);
    setWeeklyPlan(null);
    setDemoSummary(null);
  };

  if (!isAuthenticated) {
    return <LoginScreen email={email} password={password} loading={loading} error={error} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={onLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#07111d]">
      <DesktopSidebar activeSection={activeSection} onNavigate={goToSection} onLogout={onLogout} />
      <MobileMenu open={mobileMenuOpen} activeSection={activeSection} onClose={() => setMobileMenuOpen(false)} onNavigate={goToSection} onLogout={onLogout} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-slate-700/40 bg-[#081423]/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 xl:px-8">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMobileMenuOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 text-slate-300 lg:hidden">
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="app-eyebrow">Vegetation conformance hub</p>
                <p className="mt-0.5 hidden text-sm font-bold text-white sm:block">Prototype for road vegetation priority and maintenance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => void refreshData()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 transition hover:border-slate-500 hover:text-white" aria-label="Atualizar dados">
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1720px] px-4 pb-16 pt-5 sm:px-6 xl:px-8">
          <section className="animate-enter flex flex-col gap-5 border-b border-slate-700/40 pb-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="app-eyebrow">Demo mode</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">Sistema inteligente para priorizacao da manutencao da vegetacao</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Prototype focused on simulated trechos, deterministic score, ranking, map, and executive insights for academic presentation.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void onGenerateDemo()} disabled={busy} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-[0_12px_28px_rgba(16,185,129,0.22)] transition hover:bg-emerald-500 disabled:opacity-60">
                <Sparkles className="h-4 w-4" /> Gerar dados simulados
              </button>
              <button type="button" onClick={() => void onResetDemo()} disabled={busy} className="flex items-center gap-2 rounded-xl border border-slate-600/80 bg-slate-900/40 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-200 transition hover:border-slate-400 hover:bg-slate-800/60 disabled:opacity-60">
                <RefreshCcw className="h-4 w-4" /> Resetar dados
              </button>
              <button type="button" onClick={() => void onGeneratePlan()} disabled={busy} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 disabled:opacity-60">
                <Sparkles className="h-4 w-4" /> Gerar plano da semana
              </button>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <PulseMetric label="Trechos monitorados" value={dashboard?.total_trechos ?? segments.length} />
            <PulseMetric label="Prioridade media" value={dashboard?.indice_medio_risco ?? 0} />
            <PulseMetric label="Missoes ativas" value={dashboard?.missoes_planejadas ?? missions.length} />
            <PulseMetric label="Base de demo" value={demoSummary ? 'Atualizada' : 'Pronta'} compact />
          </div>

          {weeklyPlan && (
            <div className="mt-4 rounded-2xl border border-blue-400/15 bg-blue-500/8 px-4 py-3 text-sm text-blue-100">
              Weekly plan ready: {weeklyPlan.total_missoes} missions, estimated cost R$ {weeklyPlan.custo_total_estimado.toLocaleString('pt-BR')}.
            </div>
          )}

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <ScoreGuide />
            <DemoSummaryPanel summary={demoSummary} segments={segments} />
          </section>

          {loading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={() => void refreshData()} />}

          {!loading && !error && (
            <div className="mt-7 space-y-10">
              <section id="executivo" className="section-anchor space-y-4">
                <SectionTitle index="01" title="Painel executivo" description="Resumo geral para apresentacao em banca." />
                <div className="grid gap-4 2xl:grid-cols-[1fr_390px]">
                  <ExecutivePanel panel={executivePanel} />
                  <CompliancePanel data={compliance} />
                </div>
                <RegulatorySettingsPanel
                  rules={regulatoryRules}
                  onSave={async (rule) => {
                    await upsertRegulatoryRule(rule);
                    await loadData();
                  }}
                />
              </section>

              <section id="cenario" className="section-anchor space-y-4">
                <SectionTitle index="02" title="Simulacao de estrategia" description="Compare cenarios antes de consolidar a mobilizacao semanal." />
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <ScenarioSimulator scenario={scenario} onChange={setScenario} />
                  <ImpactPanel impact={impact} />
                </div>
              </section>

              <section id="mapa" className="section-anchor space-y-4">
                <SectionTitle index="03" title="Visao tatica da malha" description="Criticidade georreferenciada e fila priorizada de intervencao." />
                <div className="grid gap-4 xl:grid-cols-[1.65fr_0.85fr]">
                  <OperationalMap segments={segments} />
                  <PriorityRanking segments={segments} selectedId={selectedTrechoId} onSelect={setSelectedTrechoId} />
                </div>
                <TrechoDetail trecho={selectedTrecho} />
              </section>

              <section id="missoes" className="section-anchor space-y-4">
                <SectionTitle index="04" title="Execucao assistida" description="Pacotes de missao e explicacoes executivas para a operacao." />
                <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <MissionPlanning missions={missions} />
                  <CopilotPanel onAsk={async (question) => (await askCopilot(question)).resposta} onDownloadReport={downloadReport} />
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function LoginScreen({ email, password, loading, error, onEmailChange, onPasswordChange, onSubmit }: { email: string; password: string; loading: boolean; error: string | null; onEmailChange: (value: string) => void; onPasswordChange: (value: string) => void; onSubmit: () => Promise<void> }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden border-r border-slate-700/40 bg-[#081524] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(37,99,235,0.28),transparent_34rem)]" />
        <Brand />
        <div className="relative max-w-xl">
          <p className="app-eyebrow">Academic prototype</p>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.04] tracking-[-0.075em] text-white">Decision support for vegetation maintenance on highways.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">The ORION prototype turns road data into a clear priority score, visual ranking, and an executive story for the panel.</p>
        </div>
        <div className="relative grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-slate-700/50 bg-slate-700/50">
          <LoginMetric value="0-100" label="priority score" />
          <LoginMetric value="MAP" label="geospatial view" />
          <LoginMetric value="PDF" label="executive report" />
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-enter">
          <div className="mb-10 lg:hidden"><Brand /></div>
          <p className="app-eyebrow">Secure access</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.06em] text-white">Acesso ao prototipo</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">Use suas credenciais locais para entrar na demo.</p>
          <form className="mt-8 space-y-4" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">E-mail corporativo</span>
              <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/10" autoComplete="username" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Senha</span>
              <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3.5 text-sm text-white outline-none transition focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/10" autoComplete="current-password" />
            </label>
            {error && <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs leading-5 text-red-200">{error}</p>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-500 disabled:opacity-60">
              {loading ? 'Validando acesso...' : 'Entrar no prototipo'} <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Brand() {
  return (
    <div className="relative flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/15 shadow-[0_0_24px_rgba(37,99,235,0.18)]">
        <Radar className="h-5 w-5 text-blue-300" />
      </div>
      <div>
        <p className="text-base font-extrabold tracking-[-0.04em] text-white">MOTIVA <span className="text-blue-300">ORION</span></p>
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Road vegetation prototype</p>
      </div>
    </div>
  );
}

function LoginMetric({ value, label }: { value: string; label: string }) {
  return (
    <article className="bg-[#0d1c30]/90 p-4">
      <p className="font-mono text-lg font-semibold text-blue-200">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </article>
  );
}

function DesktopSidebar({ activeSection, onNavigate, onLogout }: { activeSection: SectionId; onNavigate: (id: SectionId) => void; onLogout: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-slate-700/40 bg-[#081524]/95 px-3 py-4 backdrop-blur lg:flex">
      <div className="px-2"><Brand /></div>
      <p className="app-eyebrow mt-10 px-3">Modules</p>
      <nav className="mt-3 space-y-1">
        {sections.map(({ id, label, subtitle, icon: Icon }) => (
          <button key={id} type="button" onClick={() => onNavigate(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${activeSection === id ? 'bg-blue-500/12 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <Icon className={`h-4 w-4 ${activeSection === id ? 'text-blue-300' : 'text-slate-500'}`} />
            <span>
              <span className="block text-xs font-bold">{label}</span>
              <span className="mt-0.5 block text-[10px] text-slate-500">{subtitle}</span>
            </span>
          </button>
        ))}
      </nav>
      <div className="mt-auto">
        <button type="button" onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-800/50 hover:text-white">
          <LogOut className="h-4 w-4" /> Encerrar sessao
        </button>
      </div>
    </aside>
  );
}

function MobileMenu({ open, activeSection, onClose, onNavigate, onLogout }: { open: boolean; activeSection: SectionId; onClose: () => void; onNavigate: (id: SectionId) => void; onLogout: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-[#06101d]/95 p-4 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <Brand />
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300"><X className="h-4 w-4" /></button>
      </div>
      <nav className="mt-10 space-y-2">
        {sections.map(({ id, label, subtitle, icon: Icon }) => (
          <button key={id} type="button" onClick={() => onNavigate(id)} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left ${activeSection === id ? 'border-blue-400/30 bg-blue-500/12' : 'border-slate-700/50 bg-slate-800/30'}`}>
            <Icon className="h-5 w-5 text-blue-300" />
            <span><span className="block text-sm font-bold text-white">{label}</span><span className="mt-1 block text-xs text-slate-500">{subtitle}</span></span>
          </button>
        ))}
      </nav>
      <button type="button" onClick={onLogout} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
        <LogOut className="h-4 w-4" /> Encerrar sessao
      </button>
    </div>
  );
}

function PulseMetric({ label, value, compact = false }: { label: string; value: string | number; compact?: boolean }) {
  return (
    <article className="rounded-xl border border-slate-700/40 bg-slate-900/35 px-3 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-500">{label}</p>
      <p className={`mt-1 font-bold text-white ${compact ? 'text-xs sm:text-sm' : 'text-lg'}`}>{value}</p>
    </article>
  );
}

function SectionTitle({ index, title, description }: { index: string; title: string; description: string }) {
  return (
    <div className="section-heading">
      <div>
        <p className="app-eyebrow">{index} / Workspace</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.055em] text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-7 rounded-2xl border border-slate-700/40 bg-slate-900/30 p-6 text-center">
      <Database className="mx-auto h-5 w-5 animate-pulse text-blue-300" />
      <p className="mt-3 text-sm font-semibold text-slate-300">Sincronizando dados...</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-red-400/20 bg-red-500/8 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
        <div>
          <p className="text-sm font-bold text-red-100">Nao foi possivel carregar a operacao</p>
          <p className="mt-1 text-xs leading-5 text-red-200/70">{message}</p>
        </div>
      </div>
      <button type="button" onClick={onRetry} className="rounded-lg border border-red-300/30 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-red-100 transition hover:bg-red-400/10">Tentar novamente</button>
    </div>
  );
}

function ScoreGuide() {
  const items = [
    { label: 'Tempo sem manutencao', value: '45%' },
    { label: 'Chuva recente', value: '18%' },
    { label: 'Umidade', value: '12%' },
    { label: 'Recorrencia', value: '20%' },
    { label: 'Risco visual/manual', value: '35%' },
    { label: 'Tipo de vegetacao', value: 'peso fixo' }
  ];

  return (
    <section className="app-panel rounded-2xl p-5">
      <p className="app-eyebrow">Score rules</p>
      <h3 className="mt-2 text-lg font-extrabold tracking-[-0.04em] text-white">Como o score e calculado</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">Heuristica deterministica de 0 a 100 para priorizar manutencao. Valores maiores significam maior urgencia operacional.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-700/50 bg-slate-900/35 p-3">
            <p className="text-xs font-bold text-white">{item.label}</p>
            <p className="mt-1 text-[11px] text-slate-400">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-blue-400/15 bg-blue-500/8 p-3 text-xs leading-5 text-blue-100">
        Classificacao: 0-39 baixo risco, 40-69 medio risco, 70-100 alto risco. Recomendacoes: inspecionar, rocar em breve, rocar com urgencia.
      </div>
    </section>
  );
}

function DemoSummaryPanel({ summary, segments }: { summary: DemoDatasetSummary | null; segments: RoadSegment[] }) {
  const topRecurrence = [...segments].sort((a, b) => b.dias_sem_manutencao - a.dias_sem_manutencao)[0];
  const topUrgency = [...segments].sort((a, b) => b.iro - a.iro)[0];
  const topInspection = [...segments].sort((a, b) => b.risco_contratual - a.risco_contratual)[0];
  const bars = [...segments].slice(0, 8).sort((a, b) => b.iro - a.iro);

  return (
    <section className="app-panel rounded-2xl p-5">
      <p className="app-eyebrow">Demo insights</p>
      <h3 className="mt-2 text-lg font-extrabold tracking-[-0.04em] text-white">Indicadores para a banca</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="Trechos simulados" value={summary?.total_trechos ?? segments.length} />
        <StatCard label="Trechos criticos" value={summary?.trechos_criticos ?? segments.filter((segment) => segment.iro >= 70).length} />
        <StatCard label="IRO medio" value={summary?.indice_medio_iro ?? 0} />
        <StatCard label="Missoes geradas" value={summary?.total_missoes ?? 0} />
      </div>
      <div className="mt-5 space-y-3">
        <InsightRow title="Trecho com maior recorrencia" value={topRecurrence ? `KM ${topRecurrence.km_inicio} - ${topRecurrence.km_fim}` : 'Sem dados'} />
        <InsightRow title="Trecho com maior urgencia" value={topUrgency ? `KM ${topUrgency.km_inicio} - ${topUrgency.km_fim}` : 'Sem dados'} />
        <InsightRow title="Trecho com prioridade de inspecao" value={topInspection ? `KM ${topInspection.km_inicio} - ${topInspection.km_fim}` : 'Sem dados'} />
      </div>
      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Ranking visual</p>
        <div className="mt-3 space-y-2">
          {bars.map((segment) => (
            <div key={segment.id} className="rounded-lg border border-slate-700/40 bg-slate-900/35 p-2">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
                <span>KM {segment.km_inicio} - {segment.km_fim}</span>
                <span className="font-mono font-bold text-white">{segment.iro}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500" style={{ width: `${segment.iro}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/35 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}

function InsightRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-900/35 px-3 py-3">
      <div>
        <p className="text-xs font-bold text-white">{title}</p>
        <p className="mt-1 text-[11px] text-slate-500">{value}</p>
      </div>
      <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-200">Insight</span>
    </div>
  );
}

export default App;
