import type { ScenarioMode } from '../../../domain/types';

interface Props {
  scenario: ScenarioMode;
  onChange: (scenario: ScenarioMode) => void;
}

const scenarios: Array<{ id: ScenarioMode; label: string; desc: string }> = [
  { id: 'seguranca', label: 'Priorizar Seguranca', desc: 'Mitigacao imediata de risco e conformidade.' },
  { id: 'economia', label: 'Priorizar Economia', desc: 'Menor custo operacional por ciclo.' },
  { id: 'equipes_reduzidas', label: 'Reduzir Equipes', desc: 'Executa com menor capacidade de campo.' },
  { id: 'frequencia_alta', label: 'Aumentar Frequencia', desc: 'Prevencao recorrente em mais trechos.' }
];

export function ScenarioSimulator({ scenario, onChange }: Props) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
      <h2 className="mb-3 text-base font-semibold text-white">Simulador de Cenarios</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {scenarios.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`rounded-lg border p-3 text-left transition ${
              scenario === item.id
                ? 'border-primary bg-primary/15'
                : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
            }`}
          >
            <p className="font-semibold text-white">{item.label}</p>
            <p className="text-sm text-slate-300">{item.desc}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
