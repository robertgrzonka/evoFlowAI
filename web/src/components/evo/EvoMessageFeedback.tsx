'use client';

import { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { clsx } from 'clsx';

type Sentiment = 'helpful' | 'not_helpful';

export type EvoMessageFeedbackCopy = {
  groupLabel: string;
  helpful: string;
  notHelpful: string;
  localOnly: string;
};

type EvoMessageFeedbackProps = {
  id: string;
  copy: EvoMessageFeedbackCopy;
  className?: string;
};

/**
 * Local-only thumbs (no API). “Preview” for future server-side feedback; copy explains non-persistence.
 * Backend: no feedback mutation in repo yet — do not imply persistence. See product backlog for /feedback.
 */
export function EvoMessageFeedback({ id, copy, className }: EvoMessageFeedbackProps) {
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const groupId = `evo-msg-feedback-${id}`;

  return (
    <div
      className={clsx('mt-2 pt-1.5 border-t border-border/40', className)}
      role="group"
      aria-labelledby={groupId}
      data-evo-message-id={id}
    >
      <p id={groupId} className="sr-only">
        {copy.groupLabel}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-text-muted uppercase tracking-wider" aria-hidden>
          {copy.groupLabel}
        </span>
        <div className="inline-flex gap-1">
          <button
            type="button"
            onClick={() => setSentiment('helpful')}
            className={clsx(
              'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
              sentiment === 'helpful'
                ? 'border-success-500/50 bg-success-500/15 text-success-200'
                : 'border-border text-text-muted hover:text-text-primary hover:border-border/80',
            )}
            aria-pressed={sentiment === 'helpful'}
            aria-label={copy.helpful}
            title={copy.helpful}
          >
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setSentiment('not_helpful')}
            className={clsx(
              'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
              sentiment === 'not_helpful'
                ? 'border-amber-500/45 bg-amber-500/10 text-amber-200'
                : 'border-border text-text-muted hover:text-text-primary hover:border-border/80',
            )}
            aria-pressed={sentiment === 'not_helpful'}
            aria-label={copy.notHelpful}
            title={copy.notHelpful}
          >
            <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-text-muted mt-1.5 leading-snug">{copy.localOnly}</p>
    </div>
  );
}
