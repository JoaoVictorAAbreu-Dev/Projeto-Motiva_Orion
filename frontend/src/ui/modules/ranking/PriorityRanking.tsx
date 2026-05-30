import type { RoadSegment } from '../../../domain/types';

interface Props {
  segments: RoadSegment[];
}

export function PriorityRanking({ segments }: Props) {
  const ordered = [...segments].sort((a, b) => b.iro - a.iro).slice(0, 8);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
      <h2 className="mb-3 text-base font-semibold text-white">Ranking de Prioridades</h2>
      <div className="space-y-2">
        {ordered.map((segment, index) => (
          <div key={segment.id} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/70 p-3">
            <span className="text-sm text-slate-200">#{index + 1} Trecho {segment.km_inicio}-{segment.km_fim}</span>
            <span className="rounded bg-critical/20 px-2 py-1 text-sm font-semibold text-critical">IRO {segment.iro}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

