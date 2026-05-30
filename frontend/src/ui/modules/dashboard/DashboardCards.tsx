import { AlertTriangle, ChartColumn, ClipboardList, Map, Route } from 'lucide-react';
import type { DashboardMetrics } from '../../../application/metrics';

interface Props {
  metrics: DashboardMetrics;
}

const cards = [
  { key: 'total_trechos', label: 'Trechos Monitorados', icon: Route },
  { key: 'trechos_criticos', label: 'Trechos Críticos', icon: AlertTriangle },
  { key: 'missoes_ativas', label: 'Missões Ativas', icon: Map },
  { key: 'economia_estimada', label: 'Economia Estimada (R$)', icon: ClipboardList },
  { key: 'indice_medio_risco', label: 'Índice Médio de Risco', icon: ChartColumn }
] as const;

export function DashboardCards({ metrics }: Props) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ key, label, icon: Icon }) => (
        <article key={key} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-slate-300">{label}</span>
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold text-white">
            {key === 'economia_estimada'
              ? metrics[key].toLocaleString('pt-BR')
              : metrics[key as keyof DashboardMetrics]}
          </p>
        </article>
      ))}
    </section>
  );
}

