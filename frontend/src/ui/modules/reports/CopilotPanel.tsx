import { Bot, Download, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ModuleHeader } from '../../components/ModuleHeader';

interface Props {
  onAsk: (question: string) => Promise<string>;
  onDownloadReport: (type: 'operacional' | 'executivo' | 'conformidade') => Promise<void>;
}

const prompts = ['Onde atuar primeiro?', 'Qual missao gera maior economia?', 'Quais trechos apresentam risco contratual?'];

export function CopilotPanel({ onAsk, onDownloadReport }: Props) {
  const [question, setQuestion] = useState('Quais trechos devo atacar primeiro?');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!question.trim()) return;
    try {
      setLoading(true);
      setError('');
      setAnswer(await onAsk(question));
    } catch {
      setError('Nao foi possivel gerar a explicacao agora. Verifique a API e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="app-panel overflow-hidden rounded-2xl">
      <ModuleHeader eyebrow="ORION intelligence" title="Copiloto operacional" description="Explicacoes executivas baseadas nos resultados calculados pelo Motor ORION." action={<Sparkles className="h-5 w-5 text-blue-300" />} />
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => setQuestion(prompt)} className="rounded-full border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-[11px] text-slate-300 transition hover:border-blue-400/40 hover:text-blue-200">
              {prompt}
            </button>
          ))}
        </div>
        <div className="relative mt-4">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="h-28 w-full resize-none rounded-xl border border-slate-700/70 bg-slate-950/40 p-3 pr-12 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/10"
            placeholder="Pergunte sobre prioridade, custo, risco ou conformidade"
          />
          <button type="button" onClick={() => void submit()} disabled={loading || !question.trim()} className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-50">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        {loading && <p className="mt-3 text-xs text-blue-300">Interpretando contexto operacional...</p>}
        {error && <p className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">{error}</p>}
        {answer && (
          <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-500/8 p-4">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-blue-300"><Bot className="h-4 w-4" /> Parecer ORION</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">{answer}</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-700/40 px-4 py-3 sm:px-5">
        <ReportButton label="Operacional" onClick={() => void onDownloadReport('operacional')} />
        <ReportButton label="Executivo" onClick={() => void onDownloadReport('executivo')} />
        <ReportButton label="Conformidade" onClick={() => void onDownloadReport('conformidade')} />
      </div>
    </section>
  );
}

function ReportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300 transition hover:border-blue-400/40 hover:text-blue-200">
      <Download className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
