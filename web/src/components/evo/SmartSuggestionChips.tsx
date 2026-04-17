'use client';

type SmartSuggestionChip = {
  id: string;
  label: string;
};

type SmartSuggestionChipsProps = {
  title?: string;
  suggestions: SmartSuggestionChip[];
  onSelect: (value: string) => void;
  selectValue?: 'label' | 'id';
};

export default function SmartSuggestionChips({
  title = 'Smart suggestions',
  suggestions,
  onSelect,
  selectValue = 'label',
}: SmartSuggestionChipsProps) {
  if (!suggestions.length) return null;

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.12em] text-text-muted">{title}</p>
      <div className="grid grid-cols-1 gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onSelect(selectValue === 'id' ? suggestion.id : suggestion.label)}
            className="text-left rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-primary-500/30 transition-colors"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}
