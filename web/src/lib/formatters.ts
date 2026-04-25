import type { UiLocale } from '@/lib/i18n/ui-locale';

export function formatPrimaryGoal(value: string, locale: UiLocale = 'en'): string {
  const v = String(value || '').trim();
  if (!v) {
    return locale === 'pl' ? 'Utrzymanie' : 'Maintenance';
  }
  const slug = v.toLowerCase().replace(/\s+/g, '_');
  if (locale === 'pl') {
    switch (slug) {
      case 'fat_loss':
        return 'Redukcja';
      case 'muscle_gain':
        return 'Masa mięśniowa';
      case 'strength':
        return 'Siła';
      case 'maintenance':
        return 'Utrzymanie';
      default:
        return v;
    }
  }
  switch (slug) {
    case 'fat_loss':
      return 'Fat loss';
    case 'muscle_gain':
      return 'Muscle gain';
    case 'strength':
      return 'Strength';
    case 'maintenance':
      return 'Maintenance';
    default:
      return v;
  }
}
