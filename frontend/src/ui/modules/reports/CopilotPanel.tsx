import { useState } from 'react';

interface Props {
  onAsk: (question: string) => string;
}

export function CopilotPanel({ onAsk }: Props) {
  const [question, setQuestion] = useState('Quais trechos devo atacar primeiro?');
  const [answer, setAnswer] = useState('');

  const submit = () => setAnswer(onAsk(question));

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
      <h2 className="mb-3 text-base font-semibold text-white">Copiloto Operacional</h2>
      <div className="space-y-3">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="h-24 w-full rounded-md border border-slate-600 bg-slate-800 p-3 text-sm text-white outline-none focus:border-primary"
          placeholder="Pergunte sobre prioridade, custo, risco ou conformidade"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Gerar Decisao
        </button>
        {answer && <p className="rounded-md border border-slate-700 bg-slate-800/70 p-3 text-sm text-slate-100">{answer}</p>}
      </div>
    </section>
  );
}
