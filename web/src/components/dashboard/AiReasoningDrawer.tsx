'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { DashboardStrings } from '@/lib/i18n/copy/dashboard';

export type AiReasoningDrawerProps = {
  open: boolean;
  onClose: () => void;
  ui: DashboardStrings;
  mainInsight: string;
  supportLine?: string;
  tips: string[];
  dataBullets: string[];
};

export default function AiReasoningDrawer({
  open,
  onClose,
  ui,
  mainInsight,
  supportLine,
  tips,
  dataBullets,
}: AiReasoningDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === 'undefined' || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <aside
        className="relative z-[81] flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">{ui.reasoningTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 text-sm">
          <p className="text-text-secondary leading-relaxed">{ui.reasoningIntro}</p>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
              {ui.mainInsight}
            </h3>
            <p className="text-text-primary leading-relaxed">{mainInsight}</p>
            {supportLine ? <p className="mt-2 text-text-secondary leading-relaxed">{supportLine}</p> : null}
          </section>
          {tips.length > 0 ? (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                {ui.reasoningTipsHeading}
              </h3>
              <ul className="list-disc space-y-2 pl-4 text-text-secondary">
                {tips.map((t) => (
                  <li key={t.slice(0, 48)}>{t}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {dataBullets.length > 0 ? (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                {ui.reasoningDataHeading}
              </h3>
              <ul className="list-disc space-y-1.5 pl-4 text-text-secondary text-xs">
                {dataBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </aside>
    </div>,
    document.body
  );
}
