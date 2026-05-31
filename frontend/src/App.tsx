import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  ChevronRight,
  CircleDot,
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
import type { ComplianceData, DashboardData, MissionPlan, RoadSegment, ScenarioMode, WeeklyPlanData } from './domain/types';
import { askCopilot, clearToken, downloadReport, generateWeeklyPlan, getCompliance, getDashboard, getMissions, getSegments, hasToken, login } from './infrastructure/api/segments.api';
import { CompliancePanel } from './ui/modules/dashboard/CompliancePanel';
import { ExecutivePanel } from './ui/modules/dashboard/ExecutivePanel';
import { ScenarioSimulator } from './ui/modules/dashboard/ScenarioSimulator';
import { OperationalMap } from './ui/modules/map/OperationalMap';
import { MissionPlanning } from './ui/modules/missions/MissionPlanning';
import { PriorityRanking } from './ui/modules/ranking/PriorityRanking';
import { TrechoDetail } from './ui/modules/ranking/TrechoDetail';
import { CopilotPanel } from './ui/modules/reports/CopilotPanel';
import { ImpactPanel } from './ui/modules/reports/ImpactPanel';

type SectionId = 'executivo' | 'cenario' | 'mapa' | 'missoes';

const sections = [
  { id: 'executivo', label: 'Centro executivo', subtitle: 'Situacao geral', icon: LayoutDashboard },
  { id: 'cenario', label: 'Cenarios', subtitle: 'Impacto previsto', icon: BarChart3 },
  { id: 'mapa', label: 'Operacao GIS', subtitle: 'Mapa e ranking', icon: Map },
  { id: 'missoes', label: 'Execucao assistida', subtitle: 'Missoes e copiloto', icon: ClipboardList }
] satisfies Array<{ id: SectionId; label: string; subtitle: string; icon: typeof LayoutDashboard }>;

function App() {
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [missions, setMissions] = useState<MissionPlan[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanData | null>(null);
  const [loading, setLoading] = useState(hasToken());
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioMode>('seguranca');
  const [activeSection, setActiveSection] = useState<SectionId>('executivo');
  const [selectedTrechoId, setSelectedTrechoId] = useState<number | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [email, setEmail] = useState('admin@motiva-orion.local');
  const [password, setPassword] = useState('orion123');
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [segmentsData, missionsData, dashboardData, complianceData] = await Promise.all([
      getSegments(),
      getMissions(),
      getDashboard(),
      getCompliance()
    ]);

    setError(null);
    setSegments(segmentsData);
    setMissions(missionsData);
    setDashboard(dashboardData);
    setCompliance(complianceData);
    if (segmentsData.length > 0) setSelectedTrechoId((current) => current ?? segmentsData[0].id);
  }, []);

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
  }, [isAuthenticated, loading]);

  const scenarioMissions = useMemo(() => buildMissionsByScenario(segments, scenario), [segments, scenario]);
  const executivePanel = useMemo(() => buildExecutivePanel(segments, missions, scenario, dashboard), [segments, missions, scenario, dashboard]);
  const impact = useMemo(() => calculateImpact(segments, scenarioMissions, scenario), [segments, scenarioMissions, scenario]);
  const selectedTrecho = useMemo(() => segments.find((segment) => segment.id === selectedTrechoId) ?? null, [segments, selectedTrechoId]);

  const goToSection = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  const onGeneratePlan = async () => {
    try {
      setGeneratingPlan(true);
      setError(null);
      setWeeklyPlan(await generateWeeklyPlan());
      await loadData();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setGeneratingPlan(false);
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
  };

  if (!isAuthenticated) {
    return <LoginScreen email={email} password={password} loading={loading} error={error} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={onLogin} />;
  }

  return (
    <div className="min-h-screen">
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
                <p className="app-eyebrow">Operational command center</p>
                <p className="mt-0.5 hidden text-sm font-bold text-white sm:block">Gestao preditiva de vegetacao rodoviaria</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/8 px-3 py-1.5 sm:flex">
                <span className="animate-pulse-soft h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-300">Sistema online</span>
              </div>
              <button type="button" onClick={() => void loadData()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 transition hover:border-slate-500 hover:text-white" aria-label="Atualizar dados">
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1720px] px-4 pb-16 pt-5 sm:px-6 xl:px-8">
          <section className="animate-enter flex flex-col gap-5 border-b border-slate-700/40 pb-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CircleDot className="h-3.5 w-3.5 text-blue-400" />
                <p className="app-eyebrow">Live operational view</p>
              </div>
              <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">Centro de Decisao Operacional</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Dados, risco e planejamento reunidos em uma leitura pronta para decisao e mobilizacao de equipes.</p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              {weeklyPlan && <p className="text-xs leading-5 text-slate-400"><strong className="text-white">{weeklyPlan.total_missoes} missoes</strong><br />Plano semanal atualizado</p>}
              <button type="button" onClick={() => void onGeneratePlan()} disabled={generatingPlan} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 disabled:opacity-60">
                <Sparkles className="h-4 w-4" /> {generatingPlan ? 'Gerando plano...' : 'Gerar plano da semana'}
              </button>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <PulseMetric label="Trechos monitorados" value={dashboard?.total_trechos ?? segments.length} />
            <PulseMetric label="IRO medio" value={dashboard?.indice_medio_risco ?? 0} />
            <PulseMetric label="Missoes ativas" value={dashboard?.missoes_planejadas ?? missions.length} />
            <PulseMetric label="Base de dados" value="Sincronizada" compact />
          </div>

          {loading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={() => void loadData()} />}

          {!loading && !error && (
            <div className="mt-7 space-y-10">
              <section id="executivo" className="section-anchor space-y-4">
                <SectionTitle index="01" title="Painel executivo" description="Situacao geral e decisao principal para o ciclo corrente." />
                <div className="grid gap-4 2xl:grid-cols-[1fr_390px]">
                  <ExecutivePanel panel={executivePanel} />
                  <CompliancePanel data={compliance} />
                </div>
              </section>

              <section id="cenario" className="section-anchor space-y-4">
                <SectionTitle index="02" title="Simulacao de estrategia" description="Projete impacto antes de consolidar a mobilizacao semanal." />
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <ScenarioSimulator scenario={scenario} onChange={setScenario} />
                  <ImpactPanel impact={impact} />
                </div>
              </section>

              <section id="mapa" className="section-anchor space-y-4">
                <SectionTitle index="03" title="Visao tática da malha" description="Criticidade georreferenciada e fila priorizada de intervencao." />
                <div className="grid gap-4 xl:grid-cols-[1.65fr_0.85fr]">
                  <OperationalMap segments={segments} />
                  <PriorityRanking segments={segments} selectedId={selectedTrechoId} onSelect={setSelectedTrechoId} />
                </div>
                <TrechoDetail trecho={selectedTrecho} />
              </section>

              <section id="missoes" className="section-anchor space-y-4">
                <SectionTitle index="04" title="Execucao assistida" description="Pacotes de missao e explicacoes executivas para mobilizacao." />
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
          <p className="app-eyebrow">Infrastructure intelligence</p>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.04] tracking-[-0.075em] text-white">Decisoes de campo com contexto, prioridade e previsibilidade.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">O ORION converte dados rodoviarios em planos operacionais claros para reduzir exposicao, custo e tempo de resposta.</p>
        </div>
        <div className="relative grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-slate-700/50 bg-slate-700/50">
          <LoginMetric value="IRO" label="Risco unificado" />
          <LoginMetric value="GIS" label="Contexto espacial" />
          <LoginMetric value="24/7" label="Leitura operacional" />
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-enter">
          <div className="mb-10 lg:hidden"><Brand /></div>
          <p className="app-eyebrow">Secure access</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.06em] text-white">Acesso ao Centro ORION</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">Entre com suas credenciais corporativas para acessar a operacao.</p>
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
              {loading ? 'Validando acesso...' : 'Entrar no centro operacional'} <ChevronRight className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">Ambiente controlado. Acesso restrito a usuarios autorizados.</p>
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
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Roadside intelligence network</p>
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
      <p className="app-eyebrow mt-10 px-3">Operational modules</p>
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
        <div className="mb-3 rounded-xl border border-slate-700/50 bg-slate-800/30 p-3">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-300"><Activity className="h-3.5 w-3.5" /> Operacao online</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">Motor ORION conectado ao banco operacional.</p>
        </div>
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
      <p className="mt-3 text-sm font-semibold text-slate-300">Sincronizando dados operacionais...</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-red-400/20 bg-red-500/8 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
        <div><p className="text-sm font-bold text-red-100">Nao foi possivel carregar a operacao</p><p className="mt-1 text-xs leading-5 text-red-200/70">{message}</p></div>
      </div>
      <button type="button" onClick={onRetry} className="rounded-lg border border-red-300/30 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-red-100 transition hover:bg-red-400/10">Tentar novamente</button>
    </div>
  );
}

export default App;
