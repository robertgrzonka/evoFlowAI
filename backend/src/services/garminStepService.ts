type FetchDailyStepsInput = {
  date: string; // YYYY-MM-DD
  apiToken: string;
};

const GARMIN_STEPS_ENDPOINT = process.env.GARMIN_DAILY_STEPS_ENDPOINT || '';

const pickStepsFromObject = (value: any): number | null => {
  if (!value || typeof value !== 'object') return null;

  const candidates = [
    value.steps,
    value.stepCount,
    value.totalSteps,
    value.summary?.steps,
    value.dailySummary?.steps,
  ];

  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return Math.round(numeric);
    }
  }

  return null;
};

const resolveStepsFromPayload = (payload: any, date: string): number | null => {
  const direct = pickStepsFromObject(payload);
  if (direct !== null) return direct;

  const arraysToCheck = [
    Array.isArray(payload) ? payload : null,
    Array.isArray(payload?.data) ? payload.data : null,
    Array.isArray(payload?.dailySummary) ? payload.dailySummary : null,
  ].filter(Boolean) as any[][];

  for (const list of arraysToCheck) {
    const exactDateMatch = list.find((item) => String(item?.date || item?.calendarDate || '').startsWith(date));
    const exactSteps = pickStepsFromObject(exactDateMatch);
    if (exactSteps !== null) return exactSteps;

    const firstWithSteps = list.map((item) => pickStepsFromObject(item)).find((value) => value !== null);
    if (firstWithSteps !== undefined && firstWithSteps !== null) return firstWithSteps;
  }

  return null;
};

export class GarminStepService {
  static isConfigured() {
    return Boolean(GARMIN_STEPS_ENDPOINT);
  }

  static async fetchDailySteps(input: FetchDailyStepsInput): Promise<number> {
    if (!GARMIN_STEPS_ENDPOINT) {
      throw new Error('GARMIN_DAILY_STEPS_ENDPOINT is not configured.');
    }

    const requestUrl = new URL(GARMIN_STEPS_ENDPOINT);
    requestUrl.searchParams.set('date', input.date);

    const response = await fetch(requestUrl.toString(), {
      method: 'GET',
      headers: {
        authorization: `Bearer ${input.apiToken}`,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Garmin sync failed (${response.status}): ${text || 'Unknown API error'}`);
    }

    const payload = await response.json();
    const steps = resolveStepsFromPayload(payload, input.date);

    if (!Number.isFinite(steps)) {
      throw new Error('Garmin response does not include a valid steps value.');
    }

    return Math.max(0, Math.round(steps as number));
  }
}
