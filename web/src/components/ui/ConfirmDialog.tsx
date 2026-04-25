'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { ButtonSpinner } from '@/components/ui/loading';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmBusy?: boolean;
  variant?: 'danger' | 'default';
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmBusy = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const confirmClass =
    variant === 'danger'
      ? 'inline-flex items-center justify-center gap-2 min-h-9 px-3.5 rounded-md text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-sm transition-[background-color,opacity] duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
      : 'btn-primary inline-flex items-center justify-center gap-2 min-h-9';

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label={cancelLabel}
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl"
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold tracking-tight text-text-primary">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-text-secondary leading-relaxed">{description}</p> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={confirmBusy} className="btn-secondary w-full sm:w-auto">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={confirmBusy} className={clsx('w-full sm:w-auto', confirmClass)}>
            {confirmBusy ? (
              <>
                <ButtonSpinner />
                {confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
