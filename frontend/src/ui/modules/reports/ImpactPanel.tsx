import { BadgeDollarSign, FileCheck2, ShieldMinus, TrendingDown } from 'lucide-react';
import type { ImpactMetrics } from '../../../domain/types';
import { ModuleHeader } from '../../components/ModuleHeader';

interface Props {
  impact: ImpactMetrics;
}

export function ImpactPanel({ impact }: Props) {
  const metrics = [
    { label: 'Economia prevista', value: `R$ ${impact.economia_prevista.toLocaleString('pt-BR')}`, icon: BadgeDollarSign, tone: 'text-emerald-300', width: 72 },
    { label: 'Reducao de risco', value: `${impact.reducao_risco_percentual}%`, icon: TrendingDown, tone: 'text-blue-300', width: impact.reducao_risco_percentual },
    { label: 'Conformidade estimada', value: `${impact.conformidade_estimada_percentual}%`, icon: FileCheck2, tone: 'text-cyan-300', width: impact.conformidade_estimada_percentual },
    { label: 'Exposicao contratual', value: `${impact.impacto_contratual}%`, icon: ShieldMinus, tone: 'text-amber-300', width: impact.impacto_contratual }
  ];

  return (
    <section className="app-panel overflow-hidden rounded-2xl">
      <ModuleHeader eyebrow="Projected outcome" title="Impacto operacional" description="Projecao consolidada para a estrategia selecionada." />
      <div className="grid gap-px bg-slate-700/40 sm:grid-cols-2">
        {metrics.map(({ label, value, icon: Icon, tone, width }) => (
          <article key={label} className="metric-grid bg-[#0d1c30] p-4">
            <div className="flex items-center justify-between">
              <Icon className={`h-4 w-4 ${tone}`} />
              <p className="text-lg font-extrabold tracking-tight text-white">{value}</p>
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-700/60">
              <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(width, 100)}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
