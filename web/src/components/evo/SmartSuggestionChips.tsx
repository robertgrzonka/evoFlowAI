'use client';

import { clsx } from 'clsx';

type SmartSuggestionChip = {
  id: string;
  label: string;
};

type SmartSuggestionChipsProps = {
  title?: string;
  suggestions: SmartSuggestionChip[];
  onSelect: (value: string) => void;
  selectValue?: 'label' | 'id';
  /** comfortable = stacked; compact = wrap (e.g. meal form to save vertical space). */
  density?: 'comfortable' | 'compact';
  className?: string;
};

export default function SmartSuggestionChips({
  title = 'Smart suggestions',
  suggestions,
  onSelect,
  selectValue = 'label',
  density = 'comfortable',
  className,
}: SmartSuggestionChipsProps) {
  if (!suggestions.length) return null;

  const compact = density === 'compact';

  return (
    <div className={className}>
      <p className="mb-2 text-xs uppercase tracking-[0.12em] text-text-muted">{title}</p>
      <div className={clsx(compact ? 'flex flex-wrap gap-2' : 'grid grid-cols-1 gap-2')}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onSelect(selectValue === 'id' ? suggestion.id : suggestion.label)}
            className={clsx(
              'text-left rounded-lg border border-border bg-surface-elevated text-text-secondary hover:text-text-primary hover:border-primary-500/30 transition-colors',
              compact
                ? 'text-xs leading-snug px-3 py-2 basis-[calc(50%-0.25rem)] min-[400px]:basis-[calc(33.333%-0.334rem)] min-w-[min(100%,160px)] grow sm:grow-0'
                : 'px-3 py-2 text-sm',
            )}
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}
