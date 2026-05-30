import type { MissionPlan } from '../../../domain/types';

interface Props {
  missions: MissionPlan[];
}

export function MissionPlanning({ missions }: Props) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
      <h2 className="mb-3 text-base font-semibold text-white">Gerador Automatico de Missoes</h2>
      <div className="space-y-3">
        {missions.length === 0 && <p className="text-sm text-slate-300">Nenhuma missao para o cenario atual.</p>}
        {missions.map((mission) => (
          <article key={mission.id} className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Missao {mission.id}</p>
              <span className="rounded bg-critical/20 px-2 py-1 text-xs font-semibold text-critical">IRO medio {mission.criticidade_media}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">Trechos: {mission.segment_ids.join(', ')}</p>
            <p className="text-sm text-slate-300">Tempo estimado: {mission.tempo_estimado_h}h</p>
            <p className="text-sm text-slate-300">Custo estimado: R$ {mission.custo_estimado.toLocaleString('pt-BR')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
