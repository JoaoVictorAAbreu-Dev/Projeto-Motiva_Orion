import type { RoadSegment } from '../../../domain/types';

interface Props {
  segments: RoadSegment[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function PriorityRanking({ segments, selectedId, onSelect }: Props) {
  const ordered = [...segments].sort((a, b) => b.iro - a.iro).slice(0, 10);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
      <h2 className="mb-3 text-base font-semibold text-white">Ranking Operacional</h2>
      <div className="space-y-2">
        {ordered.map((segment, index) => (
          <button
            key={segment.id}
            type="button"
            onClick={() => onSelect(segment.id)}
            className={`w-full rounded-md border p-3 text-left ${
              selectedId === segment.id
                ? 'border-primary bg-primary/15'
                : 'border-slate-700 bg-slate-800/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-200">#{index + 1} Trecho {segment.km_inicio}-{segment.km_fim}</span>
              <span className="rounded bg-critical/20 px-2 py-1 text-sm font-semibold text-critical">IRO {segment.iro}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
