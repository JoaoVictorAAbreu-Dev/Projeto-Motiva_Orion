import { CalendarClock, ClipboardCheck, FileWarning, History } from 'lucide-react';
import type { ComplianceData } from '../../../domain/types';
import { ModuleHeader } from '../../components/ModuleHeader';

interface Props {
  data: ComplianceData | null;
}

export function CompliancePanel({ data }: Props) {
  return (
    <section className="app-panel overflow-hidden rounded-2xl">
      <ModuleHeader eyebrow="Contract control" title="Conformidade contratual" description="Exposicao atual da operacao aos prazos e requisitos de manutencao." />
      {!data && <p className="p-5 text-sm text-slate-400">Carregando conformidade...</p>}
      {data && (
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.15fr_1fr]">
          <article className="app-panel-subtle rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-400">Conformidade geral</p>
                <p className="mt-2 text-4xl font-extrabold tracking-[-0.06em] text-white">{data.conformidade_geral}%</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-500/10">
                <ClipboardCheck className="h-6 w-6 text-emerald-300" />
              </div>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-700/60">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${data.conformidade_geral}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">Indice consolidado sobre trechos monitorados e exposicao contratual corrente.</p>
          </article>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <ComplianceItem icon={FileWarning} label="Trechos em risco" value={data.trechos_risco_contratual} tone="text-amber-300" />
            <ComplianceItem icon={CalendarClock} label="Prazo medio restante" value={`${data.prazo_medio_restante_dias} dias`} tone="text-blue-300" />
            <ComplianceItem icon={History} label="Intervencoes registradas" value={data.historico_intervencoes} tone="text-slate-200" />
          </div>
        </div>
      )}
    </section>
  );
}

function ComplianceItem({ icon: Icon, label, value, tone }: { icon: typeof FileWarning; label: string; value: string | number; tone: string }) {
  return (
    <article className="app-panel-subtle flex items-center gap-3 rounded-xl p-3">
      <Icon className={`h-4 w-4 shrink-0 ${tone}`} />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-bold text-white">{value}</p>
      </div>
    </article>
  );
}
