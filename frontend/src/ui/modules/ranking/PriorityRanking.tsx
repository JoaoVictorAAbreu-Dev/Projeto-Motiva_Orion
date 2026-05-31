import { ListFilter } from 'lucide-react';
import type { RoadSegment } from '../../../domain/types';
import { ModuleHeader } from '../../components/ModuleHeader';
import { StatusBadge } from '../../components/StatusBadge';

interface Props {
  segments: RoadSegment[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const tone = (classification: string) => {
  if (classification === 'Critico') return 'critical';
  if (classification === 'Atencao') return 'warning';
  return 'success';
};

export function PriorityRanking({ segments, selectedId, onSelect }: Props) {
  const ordered = [...segments].sort((a, b) => b.iro - a.iro).slice(0, 10);

  return (
    <section className="app-panel overflow-hidden rounded-2xl">
      <ModuleHeader eyebrow="Priority queue" title="Ranking operacional" description="Ordenacao automatica pelo maior IRO." action={<ListFilter className="h-5 w-5 text-blue-300" />} />
      <div className="max-h-[524px] space-y-1.5 overflow-y-auto p-3">
        {ordered.length === 0 && <p className="p-3 text-sm text-slate-400">Nenhum trecho disponivel para classificacao.</p>}
        {ordered.map((segment, index) => (
          <button
            key={segment.id}
            type="button"
            onClick={() => onSelect(segment.id)}
            className={`group w-full rounded-xl border p-3 text-left transition ${
              selectedId === segment.id
                ? 'border-blue-400/50 bg-blue-500/12'
                : 'border-transparent bg-slate-800/30 hover:border-slate-600/60 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="font-mono mt-1 text-xs font-semibold text-slate-500">{String(index + 1).padStart(2, '0')}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white">Trecho {segment.km_inicio} - {segment.km_fim}</p>
                  <StatusBadge label={segment.classificacao} tone={tone(segment.classificacao)} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-700/60">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-400 to-red-400" style={{ width: `${segment.iro}%` }} />
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-300">IRO {segment.iro}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
