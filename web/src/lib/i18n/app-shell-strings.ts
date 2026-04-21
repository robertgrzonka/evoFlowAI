import type { UiLocale } from './ui-locale';

export const appShellStrings: Record<
  UiLocale,
  {
    navDashboard: string;
    navChat: string;
    navMeals: string;
    navStats: string;
    navWorkouts: string;
    navGoals: string;
    navSettings: string;
    navCoachPro: string;
    loggedInAs: string;
    logout: string;
  }
> = {
  en: {
    navDashboard: 'Dashboard',
    navChat: 'Evo Chat',
    navMeals: 'Meals',
    navStats: 'Stats',
    navWorkouts: 'Workouts',
    navGoals: 'Goals',
    navSettings: 'Settings',
    navCoachPro: 'Evo Coach Pro',
    loggedInAs: 'Logged in as',
    logout: 'Logout',
  },
  pl: {
    navDashboard: 'Pulpit',
    navChat: 'Czat Evo',
    navMeals: 'Posiłki',
    navStats: 'Statystyki',
    navWorkouts: 'Treningi',
    navGoals: 'Cele',
    navSettings: 'Ustawienia',
    navCoachPro: 'Evo Coach Pro',
    loggedInAs: 'Zalogowany jako',
    logout: 'Wyloguj',
  },
};
