import clsx from 'clsx';

type Tone = 'critical' | 'warning' | 'success' | 'info' | 'neutral';

interface Props {
  label: string;
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  critical: 'border-red-400/20 bg-red-500/10 text-red-300',
  warning: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
  success: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
  info: 'border-blue-400/20 bg-blue-500/10 text-blue-300',
  neutral: 'border-slate-400/20 bg-slate-500/10 text-slate-300'
};

export function StatusBadge({ label, tone = 'neutral' }: Props) {
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]', tones[tone])}>
      {label}
    </span>
  );
}
