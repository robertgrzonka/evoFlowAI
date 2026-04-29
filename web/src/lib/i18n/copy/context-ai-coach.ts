import type { UiLocale } from '../ui-locale';

export const contextAICoachCopy: Record<
  UiLocale,
  {
    smartPrompts: string;
    placeholder: string;
    submitIdle: string;
    submitBusy: string;
    answerLabel: string;
    savedInChatNote: string;
    openInChat: string;
    openInChatTitle: string;
    toastErrorTitle: string;
    toastErrorBody: string;
  }
> = {
  en: {
    smartPrompts: 'Smart prompts',
    placeholder: 'Ask Evo about the numbers for this day — one focused question works best.',
    submitIdle: 'Ask Evo coach',
    submitBusy: 'Evo is thinking…',
    answerLabel: 'Evo’s reply',
    savedInChatNote:
      'Evo stores this Q&A in your coach thread — same list as the coach chat, not a separate hidden log.',
    openInChat: 'Open in chat',
    openInChatTitle: 'Opens the coach chat; your message should appear in the same thread, in order.',
    toastErrorTitle: 'Coach unavailable',
    toastErrorBody: 'Please try again in a moment.',
  },
  pl: {
    smartPrompts: 'Szybkie pytania',
    placeholder: 'Zapytaj Evo o ten dzień i liczby — jedno konkretne pytanie działa najlepiej.',
    submitIdle: 'Wyślij do coacha Evo',
    submitBusy: 'Evo odpowiada…',
    answerLabel: 'Odpowiedź Evo',
    savedInChatNote:
      'Evo trzyma tę wymianę w wątku coacha (ten sam, co w czacie) — to nie jest osobny, ukryty log.',
    openInChat: 'Otwórz w czacie',
    openInChatTitle: 'Otwiera czat coacha; pytanie i odpowiedź powinny być w tej samej historii, po kolei.',
    toastErrorTitle: 'Coach chwilowo niedostępny',
    toastErrorBody: 'Spróbuj ponownie za chwilę.',
  },
};
