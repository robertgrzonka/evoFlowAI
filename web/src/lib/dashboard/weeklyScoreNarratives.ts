import type { UiLocale } from '@/lib/i18n/ui-locale';

export type WeeklyScoreNarrative = { insight: string; focus: string };

export type WeeklyNutritionDayForNarrative = {
  calories: number;
  protein: number;
  mealCount: number;
  workoutSessions: number;
  workoutCaloriesBurned: number;
};

type BuildInput = {
  locale: UiLocale;
  days: WeeklyNutritionDayForNarrative[];
  averages: { calories: number; protein: number };
  goals: { calories: number; protein: number };
  priorWeekAverages: { calories: number; protein: number };
  priorAvgWorkoutKcalPerDay: number;
  daysWithMeals: number;
};

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  return Math.sqrt(mean(nums.map((x) => (x - m) ** 2)));
}

function cv(nums: number[]): number {
  const m = mean(nums);
  if (m < 1e-6) return 0;
  return stdev(nums) / m;
}

export function buildWeeklyScoreNarratives(input: BuildInput): {
  nutrition: WeeklyScoreNarrative;
  training: WeeklyScoreNarrative;
  consistency: WeeklyScoreNarrative;
} {
  const pl = input.locale === 'pl';
  const { days, averages, goals, priorWeekAverages, priorAvgWorkoutKcalPerDay, daysWithMeals } = input;

  const logged = days.filter((d) => d.mealCount > 0);
  const proteinVals = logged.map((d) => d.protein);
  const proteinCv = proteinVals.length >= 3 ? cv(proteinVals) : 0;

  const budget = goals.calories > 0 ? goals.calories : 1;
  const proteinGoal = goals.protein > 0 ? goals.protein : 1;
  const calRatio = averages.calories / budget;
  const protRatio = averages.protein / proteinGoal;

  let nutrition: WeeklyScoreNarrative;
  if (daysWithMeals < 3) {
    nutrition = pl
      ? {
          insight: 'Za mało zalogowanych dni, żeby ocenić tempo kalorii i makra.',
          focus: 'Celuj w 4–5 dni z posiłkami z rzędu — wtedy widać realny obraz tygodnia.',
        }
      : {
          insight: 'Too few logged days to judge calorie pace and macros reliably.',
          focus: 'Aim for 4–5 days with meals in a row so the week reflects real life.',
        };
  } else if (protRatio < 0.88) {
    nutrition = pl
      ? {
          insight: `Białko utrzymywało się średnio ~${Math.round(averages.protein)} g/dzień przy celu ~${Math.round(proteinGoal)} g — to główny luz w tygodniu.`,
          focus: 'Włącz stały posiłek „kotwicowy” 30–40 g białka (np. drugie śniadanie lub wczesny lunch).',
        }
      : {
          insight: `Protein averaged ~${Math.round(averages.protein)} g/day vs a ~${Math.round(proteinGoal)} g target — that is the main gap.`,
          focus: 'Add a repeatable 30–40 g protein anchor meal (mid-morning or early lunch).',
        };
  } else if (proteinCv > 0.4 && protRatio >= 0.9) {
    nutrition = pl
      ? {
          insight: 'Białko było w miarę OK, ale mocno nierówne między dniami.',
          focus: 'Dobijaj 25–35 g białka już w pierwszym posiłku, żeby rozłożyć dzień równiej.',
        }
      : {
          insight: 'Protein was generally fine but swung a lot day to day.',
          focus: 'Put 25–35 g protein in your first meal to smooth the curve across the week.',
        };
  } else if (calRatio > 1.07) {
    nutrition = pl
      ? {
          insight: `Średnie kalorie (~${Math.round(averages.calories)} kcal/dzień) leciały powyżej budżetu dnia (~${Math.round(budget)} kcal) po uwzględnieniu aktywności.`,
          focus: 'Zmniejsz największy posiłek o ~15% albo wytnij jeden kaloryczny dodatek dziennie.',
        }
      : {
          insight: `Calories averaged ~${Math.round(averages.calories)}/day above your training-adjusted day budget (~${Math.round(budget)}).`,
          focus: 'Shrink your largest meal slightly or drop one energy-dense extra per day.',
        };
  } else if (calRatio < 0.9 && daysWithMeals >= 4) {
    nutrition = pl
      ? {
          insight: `Kalorie były nisko vs budżet (~${Math.round(averages.calories)} vs ~${Math.round(budget)} kcal) — możliwe niedożywienie albo niedologi.`,
          focus: 'W dni z najniższym bilansem dopnij jeden lekki, pełny posiłek (białko + węgle + warzywa).',
        }
      : {
          insight: `Intake ran under budget (~${Math.round(averages.calories)} vs ~${Math.round(budget)} kcal) — underfueling or under-logging.`,
          focus: 'On the lowest days, add one balanced meal (protein + carbs + vegetables).',
        };
  } else {
    nutrition = pl
      ? {
          insight: 'Tempo kalorii i białka trzymało się sensownie względem celu i budżetu dnia.',
          focus: 'Utrzymaj ten schemat porcji — kolejny tydzień da porównanie tyg. do tyg.',
        }
      : {
          insight: 'Calorie and protein pacing stayed in a sensible range vs your targets.',
          focus: 'Keep this portion rhythm — next week you will get a clean week-over-week read.',
        };
  }

  const trainDays = days.filter((d) => d.workoutSessions > 0).length;
  const avgTrainKcal = mean(days.map((d) => d.workoutCaloriesBurned));
  const priorTrain = priorAvgWorkoutKcalPerDay;
  const hasPriorTrainSignal = priorTrain >= 25 || days.some((d) => d.workoutCaloriesBurned > 0);

  let training: WeeklyScoreNarrative;
  if (trainDays === 0) {
    training = pl
      ? {
          insight: 'W tym 7-dniowym oknie nie ma zalogowanego treningu.',
          focus: 'Zaplanuj 2 krótkie sesje (20–40 min) i zapisz je — nawet lekki ruch zmienia tygodniowy obraz.',
        }
      : {
          insight: 'No logged training in this 7-day window.',
          focus: 'Schedule two short sessions (20–40 min) and log them — light volume still counts.',
        };
  } else if (hasPriorTrainSignal && priorTrain >= 40 && avgTrainKcal < priorTrain * 0.72) {
    training = pl
      ? {
          insight: `Średnie spalanie z treningu spadło (~${Math.round(avgTrainKcal)} kcal/dzień vs ~${Math.round(priorTrain)} poprzednio).`,
          focus: 'Dodaj jedną progresywną sesję w tygodniu lub wydłuż główną o 10–15 minut przy stałej intensywności.',
        }
      : {
          insight: `Training burn per day dipped (~${Math.round(avgTrainKcal)} vs ~${Math.round(priorTrain)} prior week).`,
          focus: 'Add one progressive session or extend a key workout by 10–15 minutes at the same intensity.',
        };
  } else if (trainDays >= 4) {
    training = pl
      ? {
          insight: `${trainDays} dni z treningiem — obciążenie było rozłożone szeroko w tygodniu.`,
          focus: 'Zadbaj o jeden dzień lekkiej regeneracji lub mobilności, żeby jakość kolejnych sesji nie spadła.',
        }
      : {
          insight: `${trainDays} days with training — load was spread across the week.`,
          focus: 'Slot one lighter recovery or mobility day so quality stays high.',
        };
  } else {
    training = pl
      ? {
          insight: `Było ${trainDays} ${trainDays === 1 ? 'dzień' : 'dni'} z treningiem; średnio ~${Math.round(avgTrainKcal)} kcal/dzień z sesji.`,
          focus: 'Ustal stały rytm (np. 3 dni/tydz.) i trzymaj podobną długość sesji — łatwiej utrzymać progres.',
        }
      : {
          insight: `${trainDays} training day(s); ~${Math.round(avgTrainKcal)} kcal/day from logged sessions on average.`,
          focus: 'Lock a simple weekly rhythm (e.g. 3 days) with similar session length to protect progress.',
        };
  }

  const mealCounts = days.map((d) => d.mealCount);
  const daysWithAnyMeal = mealCounts.filter((m) => m > 0).length;
  const avgMeals = mean(mealCounts);
  const calCv = cv(days.map((d) => d.calories));

  let consistency: WeeklyScoreNarrative;
  if (daysWithAnyMeal < 4) {
    consistency = pl
      ? {
          insight: 'Logowanie posiłków było rzadkie — tygodniowy obraz jest tylko częściowy.',
          focus: 'Ustal jedno przypomnienie po głównych posiłkach; pełny tydzień danych = lepsze wnioski.',
        }
      : {
          insight: 'Meal logging was sparse — the weekly picture is only partial.',
          focus: 'Add a nudge after main meals; a fuller week of logs yields sharper insights.',
        };
  } else if (calCv > 0.55 && daysWithAnyMeal >= 5) {
    consistency = pl
      ? {
          insight: 'Duże wahania kalorii dzień w dzień — utrzymanie nawyków jest trudniejsze.',
          focus: 'Ustal 2–3 stałe „kotwice” (np. podobne śniadanie + drugi posiłek) na 5+ dni.',
        }
      : {
          insight: 'Calories swung widely day to day — habits are harder to sustain.',
          focus: 'Anchor 2–3 repeatable meals (e.g. breakfast + lunch pattern) for 5+ days.',
        };
  } else if (avgMeals >= 2.1 && daysWithAnyMeal >= 5) {
    consistency = pl
      ? {
          insight: 'Regularne logowanie i zwykle więcej niż jeden posiłek dziennie — dobry rytm.',
          focus: 'Doprecyzuj porcje w największym posiłku, żeby dane były jeszcze bardziej wiarygodne.',
        }
      : {
          insight: 'Steady logging with multiple meals most days — solid rhythm.',
          focus: 'Tighten portion notes on the biggest meal to make the data even more trustworthy.',
        };
  } else {
    consistency = pl
      ? {
          insight: 'Część dni ma pełniejsze logi, część pojedyncze wpisy — wzorzec jest nierówny.',
          focus: 'Celuj w min. dwa zalogowane posiłki w dni treningowe i jeden kotwicowy w dni lekkie.',
        }
      : {
          insight: 'Some days are fully logged, others only once — the pattern is uneven.',
          focus: 'Aim for at least two logs on training days and one anchor meal on lighter days.',
        };
  }

  return { nutrition, training, consistency };
}
