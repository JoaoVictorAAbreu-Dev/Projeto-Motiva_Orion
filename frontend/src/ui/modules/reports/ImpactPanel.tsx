import type { ImpactMetrics } from '../../../domain/types';

interface Props {
  impact: ImpactMetrics;
}

export function ImpactPanel({ impact }: Props) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
      <h2 className="mb-3 text-base font-semibold text-white">Tela de Impacto</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-300">Economia Prevista</p>
          <p className="text-xl font-semibold text-white">R$ {impact.economia_prevista.toLocaleString('pt-BR')}</p>
        </article>
        <article className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-300">Reducao de Risco</p>
          <p className="text-xl font-semibold text-ok">{impact.reducao_risco_percentual}%</p>
        </article>
        <article className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-300">Conformidade Estimada</p>
          <p className="text-xl font-semibold text-primary">{impact.conformidade_estimada_percentual}%</p>
        </article>
        <article className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-300">Impacto Contratual</p>
          <p className="text-xl font-semibold text-accent">{impact.impacto_contratual}%</p>
        </article>
      </div>
    </section>
  );
}
