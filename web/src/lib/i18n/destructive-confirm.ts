import type { UiLocale } from './ui-locale';

export function getDestructiveConfirmLabels(locale: UiLocale) {
  return locale === 'pl'
    ? { cancel: 'Anuluj', confirm: 'Usuń' }
    : { cancel: 'Cancel', confirm: 'Delete' };
}
