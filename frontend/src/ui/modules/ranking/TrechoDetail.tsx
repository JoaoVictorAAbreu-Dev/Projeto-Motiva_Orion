import type { RoadSegment } from '../../../domain/types';

interface Props {
  trecho: RoadSegment | null;
}

export function TrechoDetail({ trecho }: Props) {
  if (!trecho) {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
        <h2 className="mb-2 text-base font-semibold text-white">Detalhe do Trecho</h2>
        <p className="text-sm text-slate-300">Selecione um trecho no ranking para visualizar historico, score, previsao e recomendacao.</p>
      </section>
    );
  }

  const previsao = Math.min(100, trecho.nivel_vegetacao + trecho.chuva_prevista_mm * 0.8 + trecho.dias_sem_rocada * 0.35);
  const recomendacao = trecho.iro >= 61
    ? 'Rocada imediata com equipe dedicada'
    : trecho.iro >= 31
      ? 'Intervencao preventiva em ate 7 dias'
      : 'Monitoramento de rotina';

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
      <h2 className="mb-3 text-base font-semibold text-white">Detalhe do Trecho #{trecho.id}</h2>
      <div className="grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
        <p><span className="text-slate-400">KM:</span> {trecho.km_inicio} - {trecho.km_fim}</p>
        <p><span className="text-slate-400">Status:</span> {trecho.status}</p>
        <p><span className="text-slate-400">Score IRO:</span> {trecho.iro}</p>
        <p><span className="text-slate-400">Nivel rocada:</span> {trecho.nivel_vegetacao}</p>
        <p><span className="text-slate-400">Dias sem manutencao:</span> {trecho.dias_sem_rocada}</p>
        <p><span className="text-slate-400">Risco contratual:</span> {trecho.risco_contratual}</p>
      </div>

      <div className="mt-3 rounded-md border border-slate-700 bg-slate-800/70 p-3 text-sm text-slate-200">
        <p className="font-semibold text-white">Historico</p>
        <p>Ultima rocada registrada ha {trecho.dias_sem_rocada} dias; tendencia operacional influenciada por chuva prevista de {trecho.chuva_prevista_mm} mm.</p>
      </div>

      <div className="mt-3 rounded-md border border-slate-700 bg-slate-800/70 p-3 text-sm text-slate-200">
        <p className="font-semibold text-white">Previsao de Crescimento</p>
        <p>Indice projetado de crescimento: {previsao.toFixed(1)} / 100.</p>
      </div>

      <div className="mt-3 rounded-md border border-slate-700 bg-primary/15 p-3 text-sm text-slate-100">
        <p className="font-semibold text-white">Recomendacao</p>
        <p>{recomendacao}</p>
      </div>
    </section>
  );
}
