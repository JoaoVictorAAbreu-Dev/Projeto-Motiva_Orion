import { Banknote, CalendarRange, Shield, UsersRound } from 'lucide-react';
import type { ScenarioMode } from '../../../domain/types';
import { ModuleHeader } from '../../components/ModuleHeader';

interface Props {
  scenario: ScenarioMode;
  onChange: (scenario: ScenarioMode) => void;
}

const scenarios = [
  { id: 'seguranca', label: 'Priorizar seguranca', desc: 'Mitigacao imediata de risco operacional e contratual.', icon: Shield },
  { id: 'economia', label: 'Priorizar economia', desc: 'Concentracao de recursos para reduzir custo por ciclo.', icon: Banknote },
  { id: 'equipes_reduzidas', label: 'Reduzir equipes', desc: 'Replanejamento para menor capacidade de campo.', icon: UsersRound },
  { id: 'frequencia_alta', label: 'Aumentar frequencia', desc: 'Ciclo preventivo com mais intervencoes recorrentes.', icon: CalendarRange }
] satisfies Array<{ id: ScenarioMode; label: string; desc: string; icon: typeof Shield }>;

export function ScenarioSimulator({ scenario, onChange }: Props) {
  return (
    <section className="app-panel overflow-hidden rounded-2xl">
      <ModuleHeader eyebrow="Strategy workspace" title="Simulador de cenarios" description="Compare estrategias antes de consolidar a execucao semanal." />
      <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
        {scenarios.map(({ id, label, desc, icon: Icon }) => {
          const selected = scenario === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`group rounded-xl border p-4 text-left transition duration-200 ${
                selected
                  ? 'border-blue-400/50 bg-blue-500/12 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.08)]'
                  : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-500/70 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${selected ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className={`h-2 w-2 rounded-full ${selected ? 'bg-blue-400 shadow-[0_0_12px_#60a5fa]' : 'bg-slate-700'}`} />
              </div>
              <p className="mt-4 text-sm font-bold text-white">{label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{desc}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
