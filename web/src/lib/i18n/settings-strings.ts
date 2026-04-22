import type { UiLocale } from './ui-locale';

export const settingsPageStrings: Record<
  UiLocale,
  {
    backToDashboard: string;
    save: string;
    saving: string;
    pageTitle: string;
    pageSubtitle: string;
    experienceTitle: string;
    experienceSubtitle: string;
    appLanguageTitle: string;
    appLanguageSubtitle: string;
    appLanguageBeta: string;
    betaTag: string;
    langEn: string;
    langPl: string;
    sessionExpiredTitle: string;
    sessionExpiredBody: string;
    invalidWeightTitle: string;
    invalidWeightBody: string;
    invalidHeightTitle: string;
    invalidHeightBody: string;
    settingsSavedTitle: string;
    settingsSavedBody: string;
    saveFailedTitle: string;
    saveFailedBody: string;
    notificationsTitle: string;
    notificationsDesc: string;
    evoDockTitle: string;
    evoDockDesc: string;
    coachingToneTitle: string;
    coachingToneSubtitle: string;
    toneGentle: string;
    toneSupportive: string;
    toneDirect: string;
    toneStrict: string;
    proactivityTitle: string;
    proactivitySubtitle: string;
    proactivityLow: string;
    proactivityMedium: string;
    proactivityHigh: string;
    previewToneTitle: string;
    previewToneGentle: string;
    previewToneSupportive: string;
    previewToneDirect: string;
    previewToneStrict: string;
    bodyMetricsTitle: string;
    bodyMetricsSubtitle: string;
    weightLabel: string;
    heightLabel: string;
    weightPlaceholder: string;
    heightPlaceholder: string;
    garminTitle: string;
    garminSubtitle: string;
    garminConnected: string;
    garminNotConnected: string;
    garminEnvHint: string;
    garminTokenLabel: string;
    garminTokenPlaceholder: string;
    connectGarmin: string;
    connectingGarmin: string;
    syncNow: string;
    syncing: string;
    disconnect: string;
    lastSyncLabel: string;
    lastSyncNever: string;
    usingServerToken: string;
    lastErrorPrefix: string;
    toastGarminConnectedTitle: string;
    toastGarminConnectedBody: string;
    toastGarminConnectFailTitle: string;
    toastGarminConnectFailBody: string;
    toastGarminDisconnectedTitle: string;
    toastGarminDisconnectedBody: string;
    toastGarminDisconnectFailTitle: string;
    toastGarminDisconnectFailBody: string;
    toastGarminSyncedTitle: string;
    toastGarminSyncedBody: (imported: number, date: string, saved: number) => string;
    toastGarminSyncedFallback: string;
    toastGarminSyncFailTitle: string;
    toastGarminSyncFailBody: string;
    planSnapshotTitle: string;
    pillPrimaryGoal: string;
    pillCoachingTone: string;
    pillProactivity: string;
    pillRestingCalories: string;
    pillBodyWeight: string;
    pillHeight: string;
    pillProteinDay: string;
    pillProteinSuggestion: string;
    pillProteinSuggestionEmpty: string;
    pillCarbsDay: string;
    pillFatDay: string;
    pillWorkoutsWeek: string;
    pillActiveMinWeek: string;
    notSet: string;
    quickDestTitle: string;
    quickGoalTitle: string;
    quickGoalDesc: string;
    quickStatsTitle: string;
    quickStatsDesc: string;
    quickCoachTitle: string;
    quickCoachDesc: string;
    quickWorkoutsTitle: string;
    quickWorkoutsDesc: string;
    accountTitle: string;
    nameLabel: string;
    emailLabel: string;
    securityTitle: string;
    resetPassword: string;
    logout: string;
    coachingToneDisplayGentle: string;
    coachingToneDisplaySupportive: string;
    coachingToneDisplayDirect: string;
    coachingToneDisplayStrict: string;
    proactivityDisplayLow: string;
    proactivityDisplayMedium: string;
    proactivityDisplayHigh: string;
  }
> = {
  en: {
    backToDashboard: 'Back to dashboard',
    save: 'Save settings',
    saving: 'Saving...',
    pageTitle: 'Settings',
    pageSubtitle: 'Configure account experience, Evo assistant behavior, and quick access tools.',
    experienceTitle: 'Experience settings',
    experienceSubtitle: 'Control how Evo sounds and how visible it is across the product.',
    appLanguageTitle: 'App language (beta)',
    appLanguageSubtitle:
      'Navigation and key labels follow this choice. Evo insights and chat follow it when Polish is selected; in English, chat still adapts if you write in Polish.',
    appLanguageBeta: 'Beta: we are expanding translated screens. Report rough edges in feedback.',
    betaTag: 'Beta',
    langEn: 'English',
    langPl: 'Polish',
    sessionExpiredTitle: 'Session expired',
    sessionExpiredBody: 'Please log in again.',
    invalidWeightTitle: 'Invalid weight',
    invalidWeightBody: 'Weight must be between 30 and 300 kg.',
    invalidHeightTitle: 'Invalid height',
    invalidHeightBody: 'Height must be between 120 and 260 cm.',
    settingsSavedTitle: 'Settings saved',
    settingsSavedBody: 'Your app preferences were updated.',
    saveFailedTitle: 'Save failed',
    saveFailedBody: 'Could not save settings.',
    notificationsTitle: 'Notifications',
    notificationsDesc: 'Enable in-app guidance and important account feedback.',
    evoDockTitle: 'Floating Evo Chat',
    evoDockDesc: 'Show minimized Evo messenger dock across authenticated pages.',
    coachingToneTitle: 'Evo coaching tone',
    coachingToneSubtitle: 'This changes communication style, not Evo personality.',
    toneGentle: 'Gentle',
    toneSupportive: 'Supportive',
    toneDirect: 'Direct',
    toneStrict: 'Strict',
    proactivityTitle: 'Evo proactivity',
    proactivitySubtitle: 'How often Evo should interrupt with next-step suggestions.',
    proactivityLow: 'Low',
    proactivityMedium: 'Medium',
    proactivityHigh: 'High',
    previewToneTitle: 'Preview tone',
    previewToneGentle:
      'Gentle: maximum patience — lively, human wording with emoji when it fits (no fixed count); small steps, no guilt, validation first.',
    previewToneSupportive:
      'Supportive: warm and collaborative, a touch of feeling language and rare emoji, then concrete next moves.',
    previewToneDirect:
      'Direct: tight, task-focused, almost no emotion or emoji — polite accountability, flat affect.',
    previewToneStrict:
      'Strict: high standards, zero emoji, no sentimental padding — blunt about gaps, never insulting you as a person.',
    bodyMetricsTitle: 'Body metrics for AI guidance',
    bodyMetricsSubtitle: 'Evo uses this to suggest protein intake (default: about 2.0 g per kg body weight).',
    weightLabel: 'Weight (kg)',
    heightLabel: 'Height (cm)',
    weightPlaceholder: 'e.g. 78',
    heightPlaceholder: 'e.g. 180',
    garminTitle: 'Garmin step sync (Beta connector)',
    garminSubtitle:
      'Prototype connector for Garmin-like endpoints. For production, use official Garmin approval or file import.',
    garminConnected: 'Connected',
    garminNotConnected: 'Not connected',
    garminEnvHint:
      'Garmin endpoint is not configured on server. Set GARMIN_DAILY_STEPS_ENDPOINT in backend env.',
    garminTokenLabel: 'Garmin API token (optional when server has GARMIN_API_TOKEN)',
    garminTokenPlaceholder: 'Paste Garmin token only if needed',
    connectGarmin: 'Connect Garmin',
    connectingGarmin: 'Connecting...',
    syncNow: 'Sync now',
    syncing: 'Syncing...',
    disconnect: 'Disconnect',
    lastSyncLabel: 'Last sync:',
    lastSyncNever: 'Never',
    usingServerToken: 'using server token',
    lastErrorPrefix: 'Last error:',
    toastGarminConnectedTitle: 'Garmin connected',
    toastGarminConnectedBody: 'Step sync is enabled for your account.',
    toastGarminConnectFailTitle: 'Garmin connect failed',
    toastGarminConnectFailBody: 'Could not connect Garmin.',
    toastGarminDisconnectedTitle: 'Garmin disconnected',
    toastGarminDisconnectedBody: 'Automatic step sync is disabled.',
    toastGarminDisconnectFailTitle: 'Disconnect failed',
    toastGarminDisconnectFailBody: 'Could not disconnect Garmin.',
    toastGarminSyncedTitle: 'Garmin synced',
    toastGarminSyncedBody: (imported, date, saved) =>
      `Imported ${imported} steps for ${date}. Saved ${saved} steps in your day snapshot.`,
    toastGarminSyncedFallback: 'Steps were synced successfully.',
    toastGarminSyncFailTitle: 'Sync failed',
    toastGarminSyncFailBody: 'Could not sync Garmin steps.',
    planSnapshotTitle: 'Current plan snapshot',
    pillPrimaryGoal: 'Primary goal',
    pillCoachingTone: 'Coaching tone',
    pillProactivity: 'Proactivity',
    pillRestingCalories: 'Resting calories (base)',
    pillBodyWeight: 'Body weight',
    pillHeight: 'Height',
    pillProteinDay: 'Protein / day',
    pillProteinSuggestion: 'Protein suggestion (2g/kg)',
    pillProteinSuggestionEmpty: 'Add weight to calculate',
    pillCarbsDay: 'Carbs / day',
    pillFatDay: 'Fat / day',
    pillWorkoutsWeek: 'Workouts / week',
    pillActiveMinWeek: 'Active minutes / week',
    notSet: 'Not set',
    quickDestTitle: 'Quick destinations',
    quickGoalTitle: 'Goal Settings',
    quickGoalDesc: 'Calories, macros and training targets.',
    quickStatsTitle: 'Stats View',
    quickStatsDesc: 'Review nutrition progress by date.',
    quickCoachTitle: 'AI Coach',
    quickCoachDesc: 'Open Evo general or coach conversation.',
    quickWorkoutsTitle: 'Workout Coach',
    quickWorkoutsDesc: 'Track training and recovery guidance.',
    accountTitle: 'Account',
    nameLabel: 'Name',
    emailLabel: 'Email',
    securityTitle: 'Security',
    resetPassword: 'Reset password',
    logout: 'Logout',
    coachingToneDisplayGentle: 'Gentle',
    coachingToneDisplaySupportive: 'Supportive',
    coachingToneDisplayDirect: 'Direct',
    coachingToneDisplayStrict: 'Strict',
    proactivityDisplayLow: 'Low',
    proactivityDisplayMedium: 'Medium',
    proactivityDisplayHigh: 'High',
  },
  pl: {
    backToDashboard: 'Wróć do pulpitu',
    save: 'Zapisz ustawienia',
    saving: 'Zapisywanie…',
    pageTitle: 'Ustawienia',
    pageSubtitle: 'Konto, zachowanie Evo oraz szybkie integracje.',
    experienceTitle: 'Doświadczenie',
    experienceSubtitle: 'Jak brzmi Evo i jak bardzo jest widoczny w aplikacji.',
    appLanguageTitle: 'Język aplikacji (beta)',
    appLanguageSubtitle:
      'Nawigacja i wybrane etykiety podążają za tym wyborem. Insighty Evo i czat — po polsku, gdy wybierzesz polski; przy angielskim czat nadal dopasuje się, jeśli piszesz po polsku.',
    appLanguageBeta: 'Beta: tłumaczenia będą rosły. Daj znać, jeśli coś brzmi nienaturalnie.',
    betaTag: 'Beta',
    langEn: 'Angielski',
    langPl: 'Polski',
    sessionExpiredTitle: 'Sesja wygasła',
    sessionExpiredBody: 'Zaloguj się ponownie.',
    invalidWeightTitle: 'Nieprawidłowa waga',
    invalidWeightBody: 'Waga musi być między 30 a 300 kg.',
    invalidHeightTitle: 'Nieprawidłowy wzrost',
    invalidHeightBody: 'Wzrost musi być między 120 a 260 cm.',
    settingsSavedTitle: 'Ustawienia zapisane',
    settingsSavedBody: 'Preferencje aplikacji zostały zaktualizowane.',
    saveFailedTitle: 'Zapis nieudany',
    saveFailedBody: 'Nie udało się zapisać ustawień.',
    notificationsTitle: 'Powiadomienia',
    notificationsDesc: 'Wskazówki w aplikacji i ważne komunikaty konta.',
    evoDockTitle: 'Pływający czat Evo',
    evoDockDesc: 'Minimalizowany dock czatu Evo na stronach po zalogowaniu.',
    coachingToneTitle: 'Ton coachowania Evo',
    coachingToneSubtitle: 'Zmienia styl komunikacji, nie „osobowość” Evo.',
    toneGentle: 'Łagodny',
    toneSupportive: 'Wspierający',
    toneDirect: 'Bezpośredni',
    toneStrict: 'Wymagający',
    proactivityTitle: 'Proaktywność Evo',
    proactivitySubtitle: 'Jak często Evo ma proponować kolejne kroki.',
    proactivityLow: 'Niska',
    proactivityMedium: 'Średnia',
    proactivityHigh: 'Wysoka',
    previewToneTitle: 'Podgląd tonu',
    previewToneGentle:
      'Łagodny: żywy, ludzki język i emoji, gdy pasują (bez narzuconej liczby); małe kroki, bez wstydu; najpierw uznanie.',
    previewToneSupportive:
      'Wspierający: ciepło i współdecyzja, odrobina uczucia i rzadkie emoji, potem konkretne następne ruchy.',
    previewToneDirect:
      'Bezpośredni: zwięźle i rzeczowo, prawie bez emocji i bez emoji — grzeczna odpowiedzialność za wynik.',
    previewToneStrict:
      'Wymagający: zero emoji i bez sentymentalnych wstępów — twardo o lukach w danych, bez obrażania Ciebie jako osoby.',
    bodyMetricsTitle: 'Metryki ciała dla AI',
    bodyMetricsSubtitle: 'Evo używa tego m.in. do sugestii białka (domyślnie ok. 2 g na kg masy).',
    weightLabel: 'Masa (kg)',
    heightLabel: 'Wzrost (cm)',
    weightPlaceholder: 'np. 78',
    heightPlaceholder: 'np. 180',
    garminTitle: 'Synchronizacja kroków Garmin (beta)',
    garminSubtitle:
      'Prototypowy konektor. W produkcji użyj oficjalnej integracji Garmin lub importu plików.',
    garminConnected: 'Połączono',
    garminNotConnected: 'Nie połączono',
    garminEnvHint:
      'Endpoint Garmin nie jest skonfigurowany na serwerze. Ustaw GARMIN_DAILY_STEPS_ENDPOINT w env backendu.',
    garminTokenLabel: 'Token API Garmin (opcjonalnie, gdy serwer ma GARMIN_API_TOKEN)',
    garminTokenPlaceholder: 'Wklej token tylko jeśli jest wymagany',
    connectGarmin: 'Połącz Garmin',
    connectingGarmin: 'Łączenie…',
    syncNow: 'Synchronizuj teraz',
    syncing: 'Synchronizacja…',
    disconnect: 'Rozłącz',
    lastSyncLabel: 'Ostatnia synchronizacja:',
    lastSyncNever: 'Nigdy',
    usingServerToken: 'używany token serwera',
    lastErrorPrefix: 'Ostatni błąd:',
    toastGarminConnectedTitle: 'Garmin połączony',
    toastGarminConnectedBody: 'Synchronizacja kroków jest włączona dla konta.',
    toastGarminConnectFailTitle: 'Połączenie Garmin nieudane',
    toastGarminConnectFailBody: 'Nie udało się połączyć z Garmin.',
    toastGarminDisconnectedTitle: 'Garmin rozłączony',
    toastGarminDisconnectedBody: 'Automatyczna synchronizacja kroków jest wyłączona.',
    toastGarminDisconnectFailTitle: 'Rozłączenie nieudane',
    toastGarminDisconnectFailBody: 'Nie udało się rozłączyć Garmin.',
    toastGarminSyncedTitle: 'Garmin zsynchronizowany',
    toastGarminSyncedBody: (imported, date, saved) =>
      `Zaimportowano ${imported} kroków dla ${date}. Zapisano ${saved} kroków w snapshotcie dnia.`,
    toastGarminSyncedFallback: 'Kroki zostały zsynchronizowane.',
    toastGarminSyncFailTitle: 'Synchronizacja nieudana',
    toastGarminSyncFailBody: 'Nie udało się zsynchronizować kroków Garmin.',
    planSnapshotTitle: 'Snapshot bieżącego planu',
    pillPrimaryGoal: 'Cel główny',
    pillCoachingTone: 'Ton coacha',
    pillProactivity: 'Proaktywność',
    pillRestingCalories: 'Kalorie spoczynkowe (baza)',
    pillBodyWeight: 'Masa ciała',
    pillHeight: 'Wzrost',
    pillProteinDay: 'Białko / dzień',
    pillProteinSuggestion: 'Sugestia białka (2 g/kg)',
    pillProteinSuggestionEmpty: 'Podaj masę, by policzyć',
    pillCarbsDay: 'Węglowodany / dzień',
    pillFatDay: 'Tłuszcze / dzień',
    pillWorkoutsWeek: 'Treningi / tydzień',
    pillActiveMinWeek: 'Aktywne minuty / tydzień',
    notSet: 'Nie ustawiono',
    quickDestTitle: 'Szybkie przejścia',
    quickGoalTitle: 'Cele i makra',
    quickGoalDesc: 'Kalorie, makro i cele treningowe.',
    quickStatsTitle: 'Statystyki',
    quickStatsDesc: 'Postęp żywienia wg daty.',
    quickCoachTitle: 'Coach AI',
    quickCoachDesc: 'Czat Evo (ogólny lub coach).',
    quickWorkoutsTitle: 'Treningi',
    quickWorkoutsDesc: 'Trening i wskazówki regeneracji.',
    accountTitle: 'Konto',
    nameLabel: 'Imię',
    emailLabel: 'E-mail',
    securityTitle: 'Bezpieczeństwo',
    resetPassword: 'Reset hasła',
    logout: 'Wyloguj',
    coachingToneDisplayGentle: 'Łagodny',
    coachingToneDisplaySupportive: 'Wspierający',
    coachingToneDisplayDirect: 'Bezpośredni',
    coachingToneDisplayStrict: 'Wymagający',
    proactivityDisplayLow: 'Niski',
    proactivityDisplayMedium: 'Średni',
    proactivityDisplayHigh: 'Wysoki',
  },
};
