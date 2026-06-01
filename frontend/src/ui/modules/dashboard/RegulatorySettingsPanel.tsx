import { useState } from 'react';
import type { RegulatoryRule } from '../../../domain/types';

interface Props {
  rules: RegulatoryRule[];
  onSave: (rule: RegulatoryRule) => Promise<void>;
}

export function RegulatorySettingsPanel({ rules, onSave }: Props) {
  const [savingKey, setSavingKey] = useState<string | null>(null);

  return (
    <section className="app-panel rounded-2xl p-4">
      <h3 className="text-sm font-bold text-white">Configuracoes Regulatorias</h3>
      <div className="mt-4 space-y-3">
        {rules.map((rule) => (
          <form
            key={rule.key}
            className="rounded-xl border border-slate-700/40 p-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const value = Number((new FormData(form).get('value') as string) || 0);
              setSavingKey(rule.key);
              try {
                await onSave({ ...rule, value });
              } finally {
                setSavingKey(null);
              }
            }}
          >
            <p className="text-xs font-bold text-slate-200">{rule.key}</p>
            <p className="mt-1 text-[11px] text-slate-500">{rule.description}</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                name="value"
                defaultValue={rule.value}
                className="w-32 rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                disabled={savingKey === rule.key}
                className="rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60"
              >
                {savingKey === rule.key ? 'Salvando' : 'Salvar'}
              </button>
            </div>
          </form>
        ))}
      </div>
    </section>
  );
}
