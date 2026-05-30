export function ReportsPanel() {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
      <h2 className="mb-3 text-base font-semibold text-white">Relatórios</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
          <p className="font-semibold text-white">Relatório Operacional</p>
          <p className="text-sm text-slate-300">Resumo de risco, criticidade por corredor e custo preventivo.</p>
        </article>
        <article className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
          <p className="font-semibold text-white">Relatório de Conformidade</p>
          <p className="text-sm text-slate-300">SLA, trechos com risco contratual elevado e histórico de execução.</p>
        </article>
      </div>
    </section>
  );
}

