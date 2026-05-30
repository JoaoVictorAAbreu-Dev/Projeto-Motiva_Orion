import { useEffect, useMemo, useState } from 'react';
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

const sections: Array<{ id: SectionId; label: string; subtitle: string }> = [
  { id: 'executivo', label: 'Executivo', subtitle: 'Situacao e decisao principal' },
  { id: 'cenario', label: 'Cenarios', subtitle: 'Simulacao e impacto previsto' },
  { id: 'mapa', label: 'Operacional', subtitle: 'Mapa e ranking de prioridade' },
  { id: 'missoes', label: 'Execucao', subtitle: 'Missoes e copiloto' }
];

function App() {
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [missions, setMissions] = useState<MissionPlan[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioMode>('seguranca');
  const [activeSection, setActiveSection] = useState<SectionId>('executivo');
  const [selectedTrechoId, setSelectedTrechoId] = useState<number | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [email, setEmail] = useState('admin@motiva-orion.local');
  const [password, setPassword] = useState('orion.admin.123');
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken());

  const loadData = async () => {
    const [segmentsData, missionsData, dashboardData, complianceData] = await Promise.all([
      getSegments(),
      getMissions(),
      getDashboard(),
      getCompliance()
    ]);

    setSegments(segmentsData);
    setMissions(missionsData);
    setDashboard(dashboardData);
    setCompliance(complianceData);

    if (segmentsData.length > 0) {
      const first = [...segmentsData].sort((a, b) => b.iro - a.iro)[0];
      setSelectedTrechoId(first.id);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    loadData()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id as SectionId);
        }
      },
      { threshold: [0.35, 0.6], rootMargin: '-90px 0px -40% 0px' }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scenarioMissions = useMemo(() => buildMissionsByScenario(segments, scenario), [segments, scenario]);
  const executivePanel = useMemo(() => buildExecutivePanel(segments, missions, scenario, dashboard), [segments, missions, scenario, dashboard]);
  const impact = useMemo(() => calculateImpact(segments, scenarioMissions, scenario), [segments, scenarioMissions, scenario]);
  const selectedTrecho = useMemo(
    () => segments.find((s) => s.id === selectedTrechoId) ?? null,
    [segments, selectedTrechoId]
  );

  const goToSection = (id: SectionId) => {
    const node = document.getElementById(id);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onGeneratePlan = async () => {
    try {
      setGeneratingPlan(true);
      const plan = await generateWeeklyPlan();
      setWeeklyPlan(plan);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
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
    } catch (err) {
      setError((err as Error).message);
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
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <section className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 p-5 shadow-panel">
          <h1 className="text-xl font-semibold text-white">Acesso ORION</h1>
          <p className="mt-2 text-sm text-slate-300">Entre com credenciais corporativas para acessar o centro de decisao.</p>
          <div className="mt-4 space-y-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white" />
            <button type="button" onClick={() => void onLogin()} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
              Entrar
            </button>
            {error && <p className="text-sm text-critical">{error}</p>}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1450px] px-3 pb-24 pt-3 sm:px-4 md:px-6 md:pb-10 md:pt-5">
      <header className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-panel sm:p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Motiva ORION</p>
        <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">Centro de Decisao Operacional</h1>
        <p className="mt-2 text-sm text-slate-300">Plataforma para reduzir custo, risco e nao conformidade contratual com decisoes prontas para execucao.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void onGeneratePlan()}
            disabled={generatingPlan}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {generatingPlan ? 'Gerando plano...' : 'Gerar Plano Operacional da Semana'}
          </button>
          {weeklyPlan && (
            <span className="text-xs text-slate-300">
              Plano: {weeklyPlan.total_missoes} missoes | Custo R$ {weeklyPlan.custo_total_estimado.toLocaleString('pt-BR')}
            </span>
          )}
          <button type="button" onClick={onLogout} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200">
            Sair
          </button>
        </div>
      </header>

      <nav className="sticky top-0 z-40 mt-3 rounded-xl border border-slate-700/80 bg-slate-950/85 p-2 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => goToSection(section.id)}
              className={`min-w-fit rounded-lg border px-3 py-2 text-left transition ${
                activeSection === section.id
                  ? 'border-primary bg-primary/20 text-white'
                  : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500'
              }`}
            >
              <p className="text-xs font-semibold">{section.label}</p>
              <p className="text-[11px] text-slate-400">{section.subtitle}</p>
            </button>
          ))}
        </div>
      </nav>

      {loading && <p className="mt-4 text-slate-300">Carregando dados operacionais...</p>}
      {error && <p className="mt-4 text-critical">{error}</p>}

      {!loading && !error && (
        <div className="mt-4 space-y-5 sm:space-y-6">
          <section id="executivo" className="section-anchor space-y-3">
            <div className="section-heading">
              <h2 className="text-base font-semibold text-white">Painel Executivo</h2>
              <p className="text-sm text-slate-300">Leitura imediata da situacao para tomada de decisao.</p>
            </div>
            <ExecutivePanel panel={executivePanel} />
            <CompliancePanel data={compliance} />
          </section>

          <section id="cenario" className="section-anchor grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <div className="section-heading">
                <h2 className="text-base font-semibold text-white">Simulador de Cenarios</h2>
                <p className="text-sm text-slate-300">Compare estrategias antes de executar as missoes.</p>
              </div>
              <ScenarioSimulator scenario={scenario} onChange={setScenario} />
            </div>
            <div className="space-y-3">
              <div className="section-heading">
                <h2 className="text-base font-semibold text-white">Impacto Projetado</h2>
                <p className="text-sm text-slate-300">Economia, reducao de risco e conformidade estimada.</p>
              </div>
              <ImpactPanel impact={impact} />
            </div>
          </section>

          <section id="mapa" className="section-anchor space-y-3">
            <div className="section-heading">
              <h2 className="text-base font-semibold text-white">Visao Operacional</h2>
              <p className="text-sm text-slate-300">Mapa tatico com ranking e detalhe tecnico por trecho.</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
              <OperationalMap segments={segments} />
              <PriorityRanking segments={segments} selectedId={selectedTrechoId} onSelect={setSelectedTrechoId} />
            </div>
            <TrechoDetail trecho={selectedTrecho} />
          </section>

          <section id="missoes" className="section-anchor space-y-3">
            <div className="section-heading">
              <h2 className="text-base font-semibold text-white">Execucao Assistida</h2>
              <p className="text-sm text-slate-300">Pacotes de missao e justificativas em linguagem executiva.</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <MissionPlanning missions={missions} />
              <CopilotPanel onAsk={async (q) => (await askCopilot(q)).resposta} onDownloadReport={downloadReport} />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
