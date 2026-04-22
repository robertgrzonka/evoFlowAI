import type { UiLocale } from '../ui-locale';

export const chatPageCopy: Record<
  UiLocale,
  {
    pageTitle: string;
    eyebrow: string;
    conversationTitle: string;
    coachSubtitle: string;
    generalSubtitle: string;
    tabGeneral: string;
    tabCoach: string;
    you: string;
    evo: string;
    waitingMessage: string;
    emptyCoachTitle: string;
    emptyCoachDescription: string;
    emptyGeneralTitle: string;
    emptyGeneralDescription: string;
    coachModeTitle: string;
    generalModeTitle: string;
    coachSnapshot: (kcalLeft: number, proteinLeft: number) => string;
    generalSnapshotSubtitle: string;
    quickReadTitle: string;
    quickReadProteinGap: string;
    quickReadOverBudget: string;
    quickReadStable: string;
    chipsCoach: string;
    chipsGeneral: string;
    yourMessage: string;
    placeholderCoach: string;
    placeholderGeneral: string;
    sending: string;
    askCoach: string;
    askEvo: string;
    addMeal: string;
    addWorkout: string;
    coachDebug: string;
    sourceLine: string;
    statusAnalyzing: string;
    statusProteinGap: string;
    statusCorrection: string;
    statusCoachActive: string;
    statusGeneralActive: string;
    sessionExpiredTitle: string;
    sessionExpiredBody: string;
    missingMessageTitle: string;
    missingMessageBody: string;
    messageFailedTitle: string;
    messageFailedGeneric: string;
  }
> = {
  en: {
    pageTitle: 'Evo Chat',
    eyebrow: 'Evo conversation',
    conversationTitle: 'Conversation',
    coachSubtitle: 'Evo reads your day context before replying.',
    generalSubtitle: 'Talk strategy, habits, and planning.',
    tabGeneral: 'General',
    tabCoach: 'Coach',
    you: 'You',
    evo: 'Evo',
    waitingMessage: 'Analyzing your day and preparing a focused response...',
    emptyCoachTitle: 'Coach thread is empty',
    emptyCoachDescription: 'Ask Evo what is drifting today and it will propose one concrete next step.',
    emptyGeneralTitle: 'General thread is empty',
    emptyGeneralDescription: 'Start with a routine, planning, or recovery question.',
    coachModeTitle: 'Evo coach mode',
    generalModeTitle: 'Evo general mode',
    coachSnapshot: (kcalLeft, proteinLeft) =>
      `Today snapshot: ${Math.round(kcalLeft)} kcal left, ${Math.round(proteinLeft)}g protein left.`,
    generalSnapshotSubtitle: 'Use this space for decisions, planning, and consistency strategy.',
    quickReadTitle: 'Quick read from Evo',
    quickReadProteinGap: 'Protein is your biggest gap today. Solve this first and the day gets easier.',
    quickReadOverBudget: 'You are above budget. A calm correction plan now beats random restriction later.',
    quickReadStable: 'You are relatively stable. Close the day with one clean, balanced move.',
    chipsCoach: 'Smart coach suggestions',
    chipsGeneral: 'Smart suggestions',
    yourMessage: 'Your message',
    placeholderCoach: 'Example: I have around 700 kcal left and low protein. What should I eat for dinner?',
    placeholderGeneral: 'Example: Help me build a realistic weekly routine for meals and workouts.',
    sending: 'Sending...',
    askCoach: 'Ask Evo coach',
    askEvo: 'Ask Evo',
    addMeal: 'Add meal',
    addWorkout: 'Add workout',
    coachDebug: 'Coach debug snapshot',
    sourceLine: 'source: shared day snapshot',
    statusAnalyzing: 'Analyzing your day',
    statusProteinGap: 'Protein gap detected',
    statusCorrection: 'Intake correction mode',
    statusCoachActive: 'Coach mode active',
    statusGeneralActive: 'General mode active',
    sessionExpiredTitle: 'Session expired',
    sessionExpiredBody: 'Please log in again.',
    missingMessageTitle: 'Missing message',
    missingMessageBody: 'Write a message for Evo.',
    messageFailedTitle: 'Message failed',
    messageFailedGeneric: 'Could not send message.',
  },
  pl: {
    pageTitle: 'Czat Evo',
    eyebrow: 'Rozmowa z Evo',
    conversationTitle: 'Konwersacja',
    coachSubtitle: 'Evo czyta kontekst dnia przed odpowiedzią.',
    generalSubtitle: 'Strategia, nawyki, planowanie.',
    tabGeneral: 'Ogólny',
    tabCoach: 'Coach',
    you: 'Ty',
    evo: 'Evo',
    waitingMessage: 'Analizuję dzień i przygotowuję konkretną odpowiedź…',
    emptyCoachTitle: 'Wątek coacha jest pusty',
    emptyCoachDescription: 'Zapytaj, co dziś odjeżdża od planu — Evo zaproponuje jeden następny krok.',
    emptyGeneralTitle: 'Wątek ogólny jest pusty',
    emptyGeneralDescription: 'Zacznij od rutyny, planu lub regeneracji.',
    coachModeTitle: 'Tryb coach Evo',
    generalModeTitle: 'Tryb ogólny Evo',
    coachSnapshot: (kcalLeft, proteinLeft) =>
      `Dziś: ok. ${Math.round(kcalLeft)} kcal zostało, białka zostało ok. ${Math.round(proteinLeft)} g.`,
    generalSnapshotSubtitle: 'Miejsce na decyzje, plan i konsekwencję.',
    quickReadTitle: 'Szybki odczyt Evo',
    quickReadProteinGap: 'Największa luka to białko — najpierw to, reszta dnia będzie prostsza.',
    quickReadOverBudget: 'Jesteś ponad budżetem — spokojny plan korekty lepszy niż chaos.',
    quickReadStable: 'Jesteś w miarę stabilnie — domknij dzień jednym czystym ruchem.',
    chipsCoach: 'Sugestie coacha',
    chipsGeneral: 'Sugestie',
    yourMessage: 'Twoja wiadomość',
    placeholderCoach: 'Np. zostało ok. 700 kcal i mało białka. Co na kolację?',
    placeholderGeneral: 'Np. pomóż ułożyć realny tydzień jedzenia i treningów.',
    sending: 'Wysyłanie…',
    askCoach: 'Wyślij do coacha Evo',
    askEvo: 'Wyślij do Evo',
    addMeal: 'Dodaj posiłek',
    addWorkout: 'Dodaj trening',
    coachDebug: 'Podgląd debug coach',
    sourceLine: 'źródło: dzienny snapshot',
    statusAnalyzing: 'Analizuję dzień',
    statusProteinGap: 'Wykryto lukę białkową',
    statusCorrection: 'Tryb korekty spożycia',
    statusCoachActive: 'Coach aktywny',
    statusGeneralActive: 'Tryb ogólny',
    sessionExpiredTitle: 'Sesja wygasła',
    sessionExpiredBody: 'Zaloguj się ponownie.',
    missingMessageTitle: 'Brak wiadomości',
    missingMessageBody: 'Napisz wiadomość do Evo.',
    messageFailedTitle: 'Nie udało się wysłać',
    messageFailedGeneric: 'Nie można wysłać wiadomości.',
  },
};

export function getCoachPromptsForLocale(
  locale: UiLocale,
  goalMode: string,
  remainingProtein?: number,
  remainingCalories?: number
): string[] {
  if (locale === 'pl') {
    if (typeof remainingProtein === 'number' && remainingProtein > 35) {
      return [
        `Potrzebuję jeszcze ok. ${Math.round(remainingProtein)} g białka. Zaproponuj jedną realistyczną kolację na dziś.`,
        'Wyjaśnij, czemu dziś botelkiem jest białko i co zmienić jutro rano.',
        'Jedna korekcyjna kolacja wysokobiałkowa i jedna opcja zapasowa.',
      ];
    }
    if (typeof remainingCalories === 'number' && remainingCalories < -100) {
      return [
        `Jestem ok. ${Math.abs(Math.round(remainingCalories))} kcal ponad limitem. Spokojny plan korekty.`,
        'Porównaj restrykcyjną vs umiarkowaną korektę — co jest mądrzejsze dla konsekwencji?',
        'Jeden błąd, którego unikać dziś wieczorem, żeby jutro zacząć czysto?',
      ];
    }
    if (goalMode === 'FAT_LOSS') {
      return [
        'Przejrzyj mój dzień i zaproponuj jeden następny posiłek: niskokaloryczny, wysokobiałkowy.',
        'Co teraz najbardziej od celu w makrach?',
        'Praktyczny plan na resztę dnia.',
      ];
    }
    if (goalMode === 'MUSCLE_GAIN') {
      return [
        'Jak domknąć dziś dzień pod czysty przyrost masy?',
        'Propozycja kolacji: dużo białka i węgli.',
        'Co priorytetyzować po treningu dziś?',
      ];
    }
    return [
      'Przejrzyj mój dzień i zaproponuj jeden zbalansowany następny krok.',
      'Co poprawić pierwsze: kalorie, białko czy timing posiłków?',
      'Jedna zmiana w diecie i jedna w regeneracji na dziś wieczór.',
    ];
  }

  if (typeof remainingProtein === 'number' && remainingProtein > 35) {
    return [
      `I still need around ${Math.round(remainingProtein)}g protein. Build one realistic dinner for this day.`,
      'Explain why protein is the bottleneck today and what should change tomorrow morning.',
      'Give me one high-protein correction meal and one backup option.',
    ];
  }
  if (typeof remainingCalories === 'number' && remainingCalories < -100) {
    return [
      `I am over calories by around ${Math.abs(Math.round(remainingCalories))}. Give me a calm correction plan.`,
      'Compare strict vs moderate correction and pick the smarter option for consistency.',
      'What is the one mistake to avoid tonight so tomorrow starts clean?',
    ];
  }
  if (goalMode === 'FAT_LOSS') {
    return [
      'Review my day and suggest one low-calorie high-protein next meal.',
      'What is most off target in my macros right now?',
      'Give me a practical plan for the rest of today.',
    ];
  }
  if (goalMode === 'MUSCLE_GAIN') {
    return [
      'How should I finish today to support lean muscle gain?',
      'Suggest a high-protein and high-carb dinner idea.',
      'What should I prioritize after training today?',
    ];
  }
  return [
    'Review my current day and suggest one balanced next step.',
    'What should I improve first: calories, protein, or meal timing?',
    'Give me one nutrition tweak and one recovery tweak for tonight.',
  ];
}

export function getGeneralPromptsForLocale(locale: UiLocale): string[] {
  if (locale === 'pl') {
    return [
      'Pomóż zaplanować realny tydzień jedzenia i treningów.',
      'Pracowity tydzień — jak zostać konsekwentnym bez komplikowania?',
      'Prosty plan na lepsze wyniki w ciągu 14 dni.',
    ];
  }
  return [
    'Help me plan a realistic weekly routine for food and training.',
    'I have a busy week. How can I stay consistent without overcomplicating?',
    'Create a simple framework to improve my results in the next 14 days.',
  ];
}
