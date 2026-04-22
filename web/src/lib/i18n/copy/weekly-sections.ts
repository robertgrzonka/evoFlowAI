import type { UiLocale } from '../ui-locale';

export const weeklySectionsCopy: Record<
  UiLocale,
  {
    mealsEyebrow: string;
    mealsTitle: string;
    mealsSubtitle: string;
    mealsWindow: string;
    mealsDaysWithMeals: string;
    mealsEntries: string;
    avgKcalDay: string;
    avgProteinDay: string;
    avgCarbsDay: string;
    avgFatDay: string;
    targetApprox: string;
    goalG: string;
    evoCoachNote: string;
    whatToWatch: string;
    levelUpNextWeek: string;
    discussWeekInChat: string;
    mealsDayTooltipEmpty: string;
    mealsDayTooltipHeading: string;
    workoutsEyebrow: string;
    workoutsTitle: string;
    workoutsSubtitle: string;
    workoutsDaysWithTraining: string;
    workoutsSessions: string;
    avgMinutesDay: string;
    avgMinutesHint: string;
    avgSessionsDay: string;
    avgKcalBurnedDay: string;
    fromLoggedSessions: string;
    highIntensityShare: string;
    ofWeeklyTrainingMinutes: string;
    /** e.g. "4/week (~0.6/day)" — `perDay` should already be formatted (e.g. toFixed(1)). */
    sessionsGoalHint: (weeklySessionsTarget: number, perDay: string) => string;
  }
> = {
  en: {
    mealsEyebrow: '7-day lens',
    mealsTitle: 'Weekly meal snapshot',
    mealsSubtitle: 'Calories and macros per day, plus Evo’s read on what deserves your attention next.',
    mealsWindow: 'Window',
    mealsDaysWithMeals: 'days with meals',
    mealsEntries: 'entries',
    avgKcalDay: 'Avg kcal / day',
    avgProteinDay: 'Avg protein / day',
    avgCarbsDay: 'Avg carbs / day',
    avgFatDay: 'Avg fat / day',
    targetApprox: 'Target ~',
    goalG: 'Goal',
    evoCoachNote: 'Evo coach note',
    whatToWatch: 'What to watch',
    levelUpNextWeek: 'Level up next week',
    discussWeekInChat: 'Discuss this week in Evo chat',
    mealsDayTooltipEmpty: 'No meals logged for this day.',
    mealsDayTooltipHeading: 'Logged that day',
    workoutsEyebrow: '7-day lens',
    workoutsTitle: 'Weekly workout snapshot',
    workoutsSubtitle: 'Minutes, sessions, and intensity mix per day — plus Evo’s training read for next week.',
    workoutsDaysWithTraining: 'days with training',
    workoutsSessions: 'sessions',
    avgMinutesDay: 'Avg minutes / day',
    avgMinutesHint: 'min/day from weekly goal',
    avgSessionsDay: 'Avg sessions / day',
    avgKcalBurnedDay: 'Avg kcal burned / day',
    fromLoggedSessions: 'From logged sessions',
    highIntensityShare: 'High intensity share',
    ofWeeklyTrainingMinutes: 'Of weekly training minutes',
    sessionsGoalHint: (weekly, perDay) => `${weekly}/week (~${perDay}/day)`,
  },
  pl: {
    mealsEyebrow: '7 dni',
    mealsTitle: 'Tygodniowy podgląd posiłków',
    mealsSubtitle: 'Kalorie i makro dziennie oraz odczyt Evo — na co zwrócić uwagę w następnym tygodniu.',
    mealsWindow: 'Okno',
    mealsDaysWithMeals: 'dni z posiłkami',
    mealsEntries: 'wpisów',
    avgKcalDay: 'Śr. kcal / dzień',
    avgProteinDay: 'Śr. białko / dzień',
    avgCarbsDay: 'Śr. węgle / dzień',
    avgFatDay: 'Śr. tłuszcze / dzień',
    targetApprox: 'Cel ~',
    goalG: 'Cel',
    evoCoachNote: 'Notatka trenera Evo',
    whatToWatch: 'Na co uważać',
    levelUpNextWeek: 'Level up na przyszły tydzień',
    discussWeekInChat: 'Omów ten tydzień na czacie z Evo',
    mealsDayTooltipEmpty: 'Brak zalogowanych posiłków tego dnia.',
    mealsDayTooltipHeading: 'Zapisane tego dnia',
    workoutsEyebrow: '7 dni',
    workoutsTitle: 'Tygodniowy podgląd treningów',
    workoutsSubtitle: 'Minuty, sesje i mix intensywności dziennie oraz odczyt treningowy Evo na kolejny tydzień.',
    workoutsDaysWithTraining: 'dni z treningiem',
    workoutsSessions: 'sesji',
    avgMinutesDay: 'Śr. minut / dzień',
    avgMinutesHint: 'min/dzień z celu tygodniowego',
    avgSessionsDay: 'Śr. sesji / dzień',
    avgKcalBurnedDay: 'Śr. spalonych kcal / dzień',
    fromLoggedSessions: 'Z zalogowanych sesji',
    highIntensityShare: 'Udział wysokiej intensywności',
    ofWeeklyTrainingMinutes: 'Tygodniowych minut treningu',
    sessionsGoalHint: (weekly, perDay) => `${weekly}/tydz. (~${perDay}/dzień)`,
  },
};
