import type { ReactNode } from 'react';

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function ModuleHeader({ eyebrow, title, description, action }: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-700/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <p className="app-eyebrow">{eyebrow}</p>
        <h3 className="mt-1 text-base font-bold tracking-tight text-white">{title}</h3>
        {description && <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
