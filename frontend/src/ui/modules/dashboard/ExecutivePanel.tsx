import { AlertTriangle, ArrowUpRight, BadgeDollarSign, Radar, ShieldCheck } from 'lucide-react';
import type { ExecutiveDecisionPanel } from '../../../domain/types';
import { StatusBadge } from '../../components/StatusBadge';

interface Props {
  panel: ExecutiveDecisionPanel;
}

const situationTone = (situation: string) => {
  if (situation === 'Critica') return 'critical';
  if (situation === 'Atencao Elevada') return 'warning';
  return 'success';
};

export function ExecutivePanel({ panel }: Props) {
  const cards = [
    { label: 'Trechos criticos', value: panel.trechos_criticos, note: 'exigem intervencao', icon: AlertTriangle, tone: 'text-red-300', glow: 'bg-red-500/10' },
    { label: 'Missoes recomendadas', value: panel.missoes_recomendadas, note: 'para o ciclo atual', icon: Radar, tone: 'text-blue-300', glow: 'bg-blue-500/10' },
    { label: 'Economia potencial', value: `R$ ${panel.economia_potencial.toLocaleString('pt-BR')}`, note: 'otimizacao logistica', icon: BadgeDollarSign, tone: 'text-emerald-300', glow: 'bg-emerald-500/10' },
    { label: 'Conformidade', value: `${panel.conformidade_contratual}%`, note: 'estimativa contratual', icon: ShieldCheck, tone: 'text-cyan-300', glow: 'bg-cyan-500/10' }
  ];

  return (
    <section className="app-panel overflow-hidden rounded-2xl">
      <div className="grid xl:grid-cols-[1fr_340px]">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="app-eyebrow">Command overview</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-[-0.045em] text-white">Leitura executiva da operacao</h2>
            </div>
            <StatusBadge label={`Situacao ${panel.situacao_geral}`} tone={situationTone(panel.situacao_geral)} />
          </div>

          <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-slate-700/40 bg-slate-700/40 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, note, icon: Icon, tone, glow }) => (
              <article key={label} className="bg-[#0d1c30] p-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${glow}`}>
                  <Icon className={`h-4 w-4 ${tone}`} />
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</p>
                <p className="mt-1 text-xl font-extrabold tracking-tight text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{note}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="border-t border-slate-700/40 bg-gradient-to-br from-blue-600/15 via-[#10223a] to-[#0b192b] p-5 xl:border-l xl:border-t-0">
          <div className="flex items-center justify-between">
            <p className="app-eyebrow">Decisao principal</p>
            <ArrowUpRight className="h-4 w-4 text-blue-300" />
          </div>
          <p className="mt-5 text-base font-bold leading-7 text-white">{panel.recomendacao_principal}</p>
          <p className="mt-4 border-t border-blue-300/10 pt-4 text-xs leading-5 text-slate-400">
            Recomendacao gerada a partir das regras operacionais e da criticidade atual dos trechos monitorados.
          </p>
        </aside>
      </div>
    </section>
  );
}
