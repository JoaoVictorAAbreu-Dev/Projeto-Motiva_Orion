import { Clock3, Route, Truck, WalletCards } from 'lucide-react';
import type { MissionPlan } from '../../../domain/types';
import { ModuleHeader } from '../../components/ModuleHeader';
import { StatusBadge } from '../../components/StatusBadge';

interface Props {
  missions: MissionPlan[];
}

export function MissionPlanning({ missions }: Props) {
  return (
    <section className="app-panel overflow-hidden rounded-2xl">
      <ModuleHeader eyebrow="Weekly execution" title="Planejador de missoes" description={`${missions.length} pacotes operacionais prontos para mobilizacao.`} />
      <div className="space-y-2 p-3 sm:p-4">
        {missions.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center">
            <Truck className="mx-auto h-5 w-5 text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-slate-300">Nenhuma missao disponivel</p>
            <p className="mt-1 text-xs text-slate-500">Gere um plano operacional para consolidar a execucao semanal.</p>
          </div>
        )}
        {missions.map((mission) => (
          <article key={mission.id} className="rounded-xl border border-slate-700/50 bg-slate-800/35 p-4 transition hover:border-slate-600/70 hover:bg-slate-800/55">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="app-eyebrow">Mission package</p>
                <p className="mt-1 text-sm font-bold text-white">{mission.codigo}</p>
              </div>
              <StatusBadge label={`Prioridade ${mission.prioridade}`} tone={mission.prioridade === 'Alta' ? 'critical' : 'warning'} />
            </div>
            <div className="mt-4 grid gap-3 border-t border-slate-700/50 pt-4 sm:grid-cols-2">
              <MissionItem icon={Route} label="Trechos" value={mission.trecho_ids.join(', ') || 'N/A'} />
              <MissionItem icon={Truck} label="Equipe sugerida" value={mission.equipe} />
              <MissionItem icon={Clock3} label="Tempo estimado" value={`${mission.tempo_estimado_h}h`} />
              <MissionItem icon={WalletCards} label="Custo estimado" value={`R$ ${mission.custo_estimado.toLocaleString('pt-BR')}`} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MissionItem({ icon: Icon, label, value }: { icon: typeof Route; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-300" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-1 text-xs font-semibold text-slate-200">{value}</p>
      </div>
    </div>
  );
}
