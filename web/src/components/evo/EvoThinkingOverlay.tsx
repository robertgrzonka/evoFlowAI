'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AICoachAvatar from '@/components/AICoachAvatar';
import type { UiLocale } from '@/lib/i18n/ui-locale';
import {
  getEvoThinkingOverlayStrings,
  type EvoThinkingIntent,
} from '@/lib/i18n/copy/evo-thinking-overlay';

type EvoThinkingOverlayProps = {
  open: boolean;
  locale: UiLocale;
  /** Copy tuned for dashboard/chat vs meal log vs workout log. */
  intent?: EvoThinkingIntent;
};

const PHASE_MS = 2800;
/** After this, show `longWaitHint` instead of looping the main steps. */
const LONG_WAIT_MS = 10_000;

/**
 * Full-viewport “Evo is working” layer — blur + branded motion instead of a plain spinner.
 */
export default function EvoThinkingOverlay({
  open,
  locale,
  intent = 'default',
}: EvoThinkingOverlayProps) {
  const copy = useMemo(() => getEvoThinkingOverlayStrings(locale, intent), [locale, intent]);
  const lastStepIndex = Math.max(0, copy.rotating.length - 1);
  const [stepIndex, setStepIndex] = useState(0);
  const [longWait, setLongWait] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setLongWait(false);

    const id = window.setInterval(() => {
      setStepIndex((i) => {
        if (i >= lastStepIndex) {
          window.clearInterval(id);
          return lastStepIndex;
        }
        return i + 1;
      });
    }, PHASE_MS);

    return () => window.clearInterval(id);
  }, [open, lastStepIndex]);

  useEffect(() => {
    if (!open) return;
    setLongWait(false);
    const t = window.setTimeout(() => setLongWait(true), LONG_WAIT_MS);
    return () => window.clearTimeout(t);
  }, [open, locale, intent]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="evo-thinking"
          role="alertdialog"
          aria-busy="true"
          aria-live="polite"
          aria-label={copy.title}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="absolute inset-0 bg-surface/55 backdrop-blur-md" />
          <motion.div
            className="relative z-[1] max-w-md w-full overflow-hidden rounded-2xl border border-primary-500/35 bg-surface-elevated/95 p-6 shadow-[0_0_60px_-12px_rgba(236,72,153,0.35)]"
            initial={{ scale: 0.94, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div
              className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-60"
              style={{
                background:
                  'conic-gradient(from 120deg, rgba(236,72,153,0.45), rgba(99,102,241,0.35), rgba(52,211,153,0.35), rgba(236,72,153,0.45))',
                animation: 'evo-orbit 4.5s linear infinite',
              }}
            />
            <div className="relative z-10 rounded-xl bg-surface-elevated p-5 m-[1px]">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full opacity-40 blur-md scale-125"
                    style={{
                      background:
                        'radial-gradient(circle at 30% 30%, rgba(236,72,153,0.5), transparent 55%), radial-gradient(circle at 70% 60%, rgba(99,102,241,0.45), transparent 50%)',
                    }}
                  />
                  <div className="scale-125">
                    <AICoachAvatar size="md" />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-300 mb-1">{copy.title}</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{copy.subtitle}</p>
                </div>
                <div className="min-h-[3rem] w-full flex items-center justify-center px-1">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={longWait ? 'long-wait' : stepIndex}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.28 }}
                      className={`text-sm font-medium ${
                        longWait ? 'text-primary-200/95' : 'text-text-primary/90'
                      }`}
                    >
                      {longWait ? copy.longWaitHint : copy.rotating[stepIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div
                  className={`flex gap-1.5 pt-1 items-center justify-center transition-opacity ${
                    longWait ? 'opacity-95 animate-pulse' : ''
                  }`}
                  aria-hidden
                >
                  {copy.rotating.map((_, i) => {
                    const done = longWait || i < stepIndex;
                    const active = !longWait && i === stepIndex;
                    return (
                      <span
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                          longWait
                            ? 'bg-primary-400/60'
                            : active
                              ? 'bg-primary-400 scale-110'
                              : done
                                ? 'bg-primary-500/35'
                                : 'bg-border'
                        }`}
                      />
                    );
                  })}
                  {longWait ? (
                    <span className="ml-0.5 text-[10px] font-medium tracking-widest text-primary-300/90">
                      ···
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
