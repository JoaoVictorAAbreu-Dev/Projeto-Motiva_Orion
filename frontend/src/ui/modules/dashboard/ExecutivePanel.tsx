import { AlertTriangle, BadgeDollarSign, ClipboardCheck, Radar } from 'lucide-react';
import type { ExecutiveDecisionPanel } from '../../../domain/types';

interface Props {
  panel: ExecutiveDecisionPanel;
}

export function ExecutivePanel({ panel }: Props) {
  const situationColor = panel.situacao_geral === 'Critica' ? 'text-critical' : panel.situacao_geral === 'Atencao Elevada' ? 'text-accent' : 'text-ok';

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/85 p-4 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Painel Executivo de Decisao</h2>
        <span className={`text-sm font-semibold ${situationColor}`}>Situacao: {panel.situacao_geral}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300"><AlertTriangle className="h-4 w-4" /> Trechos Criticos</p>
          <p className="mt-2 text-2xl font-semibold text-white">{panel.trechos_criticos}</p>
        </article>
        <article className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300"><Radar className="h-4 w-4" /> Missoes Recomendadas</p>
          <p className="mt-2 text-2xl font-semibold text-white">{panel.missoes_recomendadas}</p>
        </article>
        <article className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300"><BadgeDollarSign className="h-4 w-4" /> Economia Potencial</p>
          <p className="mt-2 text-2xl font-semibold text-white">R$ {panel.economia_potencial.toLocaleString('pt-BR')}</p>
        </article>
        <article className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300"><ClipboardCheck className="h-4 w-4" /> Decisao Principal</p>
          <p className="mt-2 text-sm text-slate-100">{panel.recomendacao_principal}</p>
        </article>
      </div>
    </section>
  );
}
