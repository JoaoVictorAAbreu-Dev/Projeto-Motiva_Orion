import type { ComplianceData } from '../../../domain/types';

interface Props {
  data: ComplianceData | null;
}

export function CompliancePanel({ data }: Props) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
      <h2 className="mb-3 text-base font-semibold text-white">Painel de Conformidade</h2>
      {!data && <p className="text-sm text-slate-300">Carregando conformidade...</p>}
      {data && (
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-300">Conformidade Geral</p>
            <p className="text-xl font-semibold text-white">{data.conformidade_geral}%</p>
          </article>
          <article className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-300">Trechos em Risco Contratual</p>
            <p className="text-xl font-semibold text-white">{data.trechos_risco_contratual}</p>
          </article>
          <article className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-300">Prazo Medio Restante</p>
            <p className="text-xl font-semibold text-white">{data.prazo_medio_restante_dias} dias</p>
          </article>
          <article className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-300">Historico de Intervencoes</p>
            <p className="text-xl font-semibold text-white">{data.historico_intervencoes}</p>
          </article>
        </div>
      )}
    </section>
  );
}
