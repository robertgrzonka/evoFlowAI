import type { CoachProPlan } from '@/lib/coach-pro/types';
import type { CoachProPageCopy } from '@/lib/i18n/copy/coach-pro-page';

function sourceLabel(
  copy: CoachProPageCopy,
  source: CoachProPlan['shoppingListSource'],
): string {
  switch (source) {
    case 'ai':
      return copy.shoppingSourceAi;
    case 'fallback':
      return copy.shoppingSourceFallback;
    case 'derived-from-fallback-bases':
      return copy.shoppingSourceDerivedFromFallbackBases;
    case 'derived-from-plan':
      return copy.shoppingSourceDerivedFromPlan;
    case 'unknown':
    default:
      return copy.shoppingSourceUnknown;
  }
}

type CoachProShoppingListIntroProps = {
  copy: CoachProPageCopy;
  source: CoachProPlan['shoppingListSource'];
  warnings: string[];
  showAllergiesHint: boolean;
};

/** Source chip, server warnings, and optional allergy reminder — kept compact for the shop list. */
export function CoachProShoppingListIntro({
  copy,
  source,
  warnings,
  showAllergiesHint,
}: CoachProShoppingListIntroProps) {
  return (
    <>
      <div className="mb-2 flex flex-wrap items-baseline gap-2 text-[10px]">
        <span className="text-text-muted uppercase tracking-wider">{copy.shoppingListSourceBadge}</span>
        <span className="inline-flex items-center rounded-md border border-border/80 bg-background/40 px-1.5 py-0.5 font-medium text-text-secondary">
          {sourceLabel(copy, source)}
        </span>
      </div>
      {warnings.length > 0 ? (
        <div
          role="status"
          className="mb-2 rounded-md border border-amber-300/35 bg-amber-300/5 px-2 py-1.5 text-[10px] text-amber-100/95"
        >
          <p className="mb-0.5 font-semibold text-amber-200/90">{copy.shoppingListWarningsTitle}</p>
          <ul className="list-disc space-y-0.5 pl-3">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {showAllergiesHint ? (
        <p className="mb-2 text-[10px] text-text-muted leading-snug">{copy.shoppingListAllergiesHint}</p>
      ) : null}
    </>
  );
}
