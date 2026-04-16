'use client';

import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import EvoMark from '@/components/EvoMark';

export type AppToastVariant = 'success' | 'error' | 'info' | 'warning';

export default function AppToastCard({
  variant,
  title,
  description,
}: {
  variant: AppToastVariant;
  title: string;
  description?: string;
}) {
  const styles = {
    success: {
      border: 'border-success-500/40',
      icon: <CheckCircle2 className="h-4 w-4 text-success-400" />,
    },
    error: {
      border: 'border-red-400/45',
      icon: <XCircle className="h-4 w-4 text-red-300" />,
    },
    info: {
      border: 'border-info-500/40',
      icon: <Info className="h-4 w-4 text-info-400" />,
    },
    warning: {
      border: 'border-amber-400/40',
      icon: <AlertTriangle className="h-4 w-4 text-amber-300" />,
    },
  } as const;

  const style = styles[variant];

  return (
    <div className={`max-w-[360px] rounded-lg border ${style.border} bg-surface/95 backdrop-blur px-3 py-2.5 shadow-lg shadow-black/25 flex items-start gap-2.5`}>
      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center">
        {variant === 'info' ? <EvoMark className="h-4 w-4 text-primary-400" /> : style.icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary leading-snug">{title}</p>
        {description ? <p className="text-xs text-text-secondary mt-1 leading-snug">{description}</p> : null}
      </div>
    </div>
  );
}
