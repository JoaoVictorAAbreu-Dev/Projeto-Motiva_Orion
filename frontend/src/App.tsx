import { useEffect, useMemo, useState } from 'react';
import { askOperationalCopilot } from './application/copilot';
import { buildExecutivePanel, calculateImpact } from './application/decision';
import { buildMissionsByScenario } from './application/missions';
import type { RoadSegment, ScenarioMode } from './domain/types';
import { getSegments } from './infrastructure/api/segments.api';
import { ExecutivePanel } from './ui/modules/dashboard/ExecutivePanel';
import { ScenarioSimulator } from './ui/modules/dashboard/ScenarioSimulator';
import { MissionPlanning } from './ui/modules/missions/MissionPlanning';
import { OperationalMap } from './ui/modules/map/OperationalMap';
import { PriorityRanking } from './ui/modules/ranking/PriorityRanking';
import { CopilotPanel } from './ui/modules/reports/CopilotPanel';
import { ImpactPanel } from './ui/modules/reports/ImpactPanel';

function App() {
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioMode>('seguranca');

  useEffect(() => {
    getSegments()
      .then(setSegments)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const missions = useMemo(() => buildMissionsByScenario(segments, scenario), [segments, scenario]);
  const executivePanel = useMemo(() => buildExecutivePanel(segments, missions, scenario), [segments, missions, scenario]);
  const impact = useMemo(() => calculateImpact(segments, missions, scenario), [segments, missions, scenario]);

  return (
    <main className="mx-auto min-h-screen max-w-[1450px] space-y-6 p-4 md:p-6">
      <header className="rounded-xl border border-slate-700 bg-slate-900/85 p-4 shadow-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Motiva ORION</p>
        <h1 className="text-2xl font-semibold text-white">Centro de Decisao Operacional</h1>
        <p className="text-sm text-slate-300">Decisoes prontas para execucao com base em risco, custo e conformidade.</p>
      </header>

      {loading && <p className="text-slate-300">Carregando dados operacionais...</p>}
      {error && <p className="text-critical">{error}</p>}

      {!loading && !error && (
        <>
          <ExecutivePanel panel={executivePanel} />
          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <ScenarioSimulator scenario={scenario} onChange={setScenario} />
            <ImpactPanel impact={impact} />
          </section>
          <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <OperationalMap segments={segments} />
            <PriorityRanking segments={segments} />
          </section>
          <section className="grid gap-4 xl:grid-cols-2">
            <MissionPlanning missions={missions} />
            <CopilotPanel onAsk={(q) => askOperationalCopilot(q, segments, missions)} />
          </section>
        </>
      )}
    </main>
  );
}

export default App;
