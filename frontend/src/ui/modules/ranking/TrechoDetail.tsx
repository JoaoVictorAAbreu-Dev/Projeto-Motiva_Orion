import { CalendarClock, MapPin, Route, Sprout, TrendingUp } from 'lucide-react';
import type { RoadSegment } from '../../../domain/types';
import { ModuleHeader } from '../../components/ModuleHeader';
import { StatusBadge } from '../../components/StatusBadge';

interface Props {
  trecho: RoadSegment | null;
}

const tone = (classification: string) => {
  const value = classification.toLowerCase();
  if (value.includes('alto') || value.includes('crit')) return 'critical';
  if (value.includes('medio') || value.includes('atenc')) return 'warning';
  return 'success';
};

export function TrechoDetail({ trecho }: Props) {
  if (!trecho) {
    return (
      <section className="app-panel overflow-hidden rounded-2xl">
        <ModuleHeader eyebrow="Segment intelligence" title="Detalhe do trecho" />
        <p className="p-5 text-sm leading-6 text-slate-400">Selecione um trecho no ranking para visualizar diagnostico, previsao e recomendacao.</p>
      </section>
    );
  }

  const previsao = Math.min(100, trecho.nivel_rocada + trecho.chuva_acumulada_mm * 0.6 + trecho.dias_sem_manutencao * 0.35);

  return (
    <section className="app-panel overflow-hidden rounded-2xl">
      <ModuleHeader
        eyebrow="Segment intelligence"
        title={`Trecho #${trecho.id} | KM ${trecho.km_inicio} - ${trecho.km_fim}`}
        description="Diagnostico consolidado para tomada de decisao tática."
        action={<StatusBadge label={trecho.classificacao} tone={tone(trecho.classificacao)} />}
      />
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
        <Detail icon={Route} label="Score IRO" value={`${trecho.iro} / 100`} />
        <Detail icon={Sprout} label="Nivel rocada" value={trecho.nivel_rocada} />
        <Detail icon={CalendarClock} label="Sem manutencao" value={`${trecho.dias_sem_manutencao} dias`} />
        <Detail icon={TrendingUp} label="Risco contratual" value={trecho.risco_contratual} />
        <Detail icon={MapPin} label="Posicao operacional" value={`${trecho.sentido} | ${trecho.lado}`} />
      </div>
      <div className="grid gap-px border-t border-slate-700/40 bg-slate-700/40 lg:grid-cols-3">
        <Insight title="Historico operacional">
          Ultima intervencao registrada ha {trecho.dias_sem_manutencao} dias no sentido {trecho.sentido}, lado {trecho.lado}.
        </Insight>
        <Insight title="Previsao de crescimento">
          Indice projetado de crescimento: <strong className="text-white">{previsao.toFixed(1)} / 100</strong>.
        </Insight>
        <Insight title="Acao recomendada" highlighted>
          {trecho.recomendacao_acao}. Prazo: <strong>{trecho.recomendacao_prazo_dias} dias</strong>. Metodo: {trecho.recomendacao_metodo}.
        </Insight>
      </div>
    </section>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof Route; label: string; value: string | number }) {
  return (
    <article className="app-panel-subtle rounded-xl p-3">
      <Icon className="h-4 w-4 text-blue-300" />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </article>
  );
}

function Insight({ title, children, highlighted = false }: { title: string; children: React.ReactNode; highlighted?: boolean }) {
  return (
    <article className={`p-4 text-xs leading-5 ${highlighted ? 'bg-blue-500/12 text-blue-100' : 'bg-[#0c1b2f] text-slate-400'}`}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">{title}</p>
      {children}
    </article>
  );
}
