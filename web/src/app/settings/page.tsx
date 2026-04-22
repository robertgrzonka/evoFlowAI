'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import {
  Bell,
  Cable,
  ChartColumnIncreasing,
  Dumbbell,
  Link2Off,
  LogOut,
  RefreshCw,
  MessageSquareMore,
  Save,
  ShieldCheck,
  Target,
  UserRound,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import { ME_QUERY, STEP_SYNC_STATUS_QUERY } from '@/lib/graphql/queries';
import {
  CONNECT_GARMIN_STEP_SYNC_MUTATION,
  DISCONNECT_STEP_SYNC_MUTATION,
  SYNC_GARMIN_STEPS_MUTATION,
  UPDATE_PREFERENCES_MUTATION,
} from '@/lib/graphql/mutations';
import { clearAuthToken } from '@/lib/auth-token';
import { clearApolloClientCache } from '@/lib/apollo-client';
import { ButtonSpinner, PageLoader } from '@/components/ui/loading';
import { appToast } from '@/lib/app-toast';
import { buildDayRefetchQueriesAfterLog, kickDeferredDashboardAndWeeklyEvo } from '@/lib/day-data';
import { formatPrimaryGoal } from '@/lib/formatters';
import { AISectionHeader, EvoHintCard } from '@/components/evo';
import { settingsPageStrings } from '@/lib/i18n/settings-strings';
import { graphqlAppLocaleToUi } from '@/lib/i18n/ui-locale';
import { persistPublicUiLocale } from '@/lib/i18n/use-public-ui-locale';

const COACHING_TONE_OPTIONS = ['GENTLE', 'SUPPORTIVE', 'DIRECT', 'STRICT'] as const;
type CoachingToneUi = (typeof COACHING_TONE_OPTIONS)[number];

export default function SettingsPage() {
  const client = useApolloClient();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [evoDockEnabled, setEvoDockEnabled] = useState(true);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [coachingTone, setCoachingTone] = useState<CoachingToneUi>('SUPPORTIVE');
  const [proactivityLevel, setProactivityLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [appLocale, setAppLocale] = useState<'EN' | 'PL'>('EN');
  const [garminToken, setGarminToken] = useState('');

  const { data, loading, error } = useQuery(ME_QUERY);
  const { data: stepSyncData, loading: stepSyncLoading, refetch: refetchStepSync } = useQuery(STEP_SYNC_STATUS_QUERY, {
    variables: { provider: 'GARMIN' },
  });
  const [updatePreferences, { loading: saving }] = useMutation(UPDATE_PREFERENCES_MUTATION, {
    onCompleted: () => {
      kickDeferredDashboardAndWeeklyEvo(client);
    },
    refetchQueries: [{ query: ME_QUERY }, ...buildDayRefetchQueriesAfterLog(today)],
    awaitRefetchQueries: true,
  });
  const [connectGarminStepSync, { loading: connectingGarmin }] = useMutation(CONNECT_GARMIN_STEP_SYNC_MUTATION);
  const [disconnectStepSync, { loading: disconnectingGarmin }] = useMutation(DISCONNECT_STEP_SYNC_MUTATION);
  const [syncGarminSteps, { loading: syncingGarmin }] = useMutation(SYNC_GARMIN_STEPS_MUTATION);

  useEffect(() => {
    if (!data?.me?.preferences) return;
    setNotificationsEnabled(Boolean(data.me.preferences.notifications));
    setWeightKg(data.me.preferences.weightKg ? String(data.me.preferences.weightKg) : '');
    setHeightCm(data.me.preferences.heightCm ? String(data.me.preferences.heightCm) : '');
    const raw = String(data.me.preferences.coachingTone || 'SUPPORTIVE').toUpperCase();
    const next = COACHING_TONE_OPTIONS.includes(raw as CoachingToneUi) ? (raw as CoachingToneUi) : 'SUPPORTIVE';
    setCoachingTone(next);
    setProactivityLevel(String(data.me.preferences.proactivityLevel || 'MEDIUM').toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH');
    setAppLocale(data.me.preferences.appLocale === 'PL' ? 'PL' : 'EN');
  }, [data]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('evoflowai_evo_dock_enabled');
    setEvoDockEnabled(raw === null ? true : raw !== 'false');
  }, []);

  useEffect(() => {
    if (!error) return;
    const errS = settingsPageStrings[graphqlAppLocaleToUi(appLocale)];
    appToast.error(errS.sessionExpiredTitle, errS.sessionExpiredBody);
    void (async () => {
      clearAuthToken();
      await clearApolloClientCache();
      router.push('/login');
    })();
  }, [error, router, appLocale]);

  const s = settingsPageStrings[graphqlAppLocaleToUi(appLocale)];

  const handleSaveSettings = async () => {
    const parsedWeight = weightKg.trim() === '' ? null : Number(weightKg);
    const parsedHeight = heightCm.trim() === '' ? null : Number(heightCm);

    if (parsedWeight !== null && (!Number.isFinite(parsedWeight) || parsedWeight < 30 || parsedWeight > 300)) {
      appToast.warning(s.invalidWeightTitle, s.invalidWeightBody);
      return;
    }

    if (parsedHeight !== null && (!Number.isFinite(parsedHeight) || parsedHeight < 120 || parsedHeight > 260)) {
      appToast.warning(s.invalidHeightTitle, s.invalidHeightBody);
      return;
    }

    try {
      await updatePreferences({
        variables: {
          input: {
            notifications: notificationsEnabled,
            weightKg: parsedWeight,
            heightCm: parsedHeight,
            coachingTone,
            proactivityLevel,
            appLocale,
          },
        },
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('evoflowai_evo_dock_enabled', String(evoDockEnabled));
        window.dispatchEvent(new Event('evo-settings-updated'));
        persistPublicUiLocale(graphqlAppLocaleToUi(appLocale));
      }
      appToast.success(s.settingsSavedTitle, s.settingsSavedBody);
    } catch (mutationError: any) {
      appToast.error(s.saveFailedTitle, mutationError.message || s.saveFailedBody);
    }
  };

  const handleLogout = async () => {
    clearAuthToken();
    await clearApolloClientCache();
    router.push('/');
  };

  if (loading) {
    return <PageLoader />;
  }

  const user = data?.me;
  const garminStatus = stepSyncData?.stepSyncStatus;
  const proteinSuggestionByWeight =
    typeof user?.preferences?.weightKg === 'number' ? Math.round(user.preferences.weightKg * 2) : null;

  const handleConnectGarmin = async () => {
    try {
      await connectGarminStepSync({
        variables: {
          input: garminToken.trim() ? { apiToken: garminToken.trim() } : {},
        },
      });
      setGarminToken('');
      await refetchStepSync();
      appToast.success(s.toastGarminConnectedTitle, s.toastGarminConnectedBody);
    } catch (mutationError: any) {
      appToast.error(s.toastGarminConnectFailTitle, mutationError.message || s.toastGarminConnectFailBody);
    }
  };

  const handleDisconnectGarmin = async () => {
    try {
      await disconnectStepSync({ variables: { provider: 'GARMIN' } });
      await refetchStepSync();
      appToast.success(s.toastGarminDisconnectedTitle, s.toastGarminDisconnectedBody);
    } catch (mutationError: any) {
      appToast.error(s.toastGarminDisconnectFailTitle, mutationError.message || s.toastGarminDisconnectFailBody);
    }
  };

  const handleSyncGarminNow = async () => {
    try {
      const result = await syncGarminSteps({ variables: { date: today } });
      await refetchStepSync();
      const payload = result.data?.syncGarminSteps;
      appToast.success(
        s.toastGarminSyncedTitle,
        payload
          ? s.toastGarminSyncedBody(payload.importedSteps, payload.date, payload.savedSteps)
          : s.toastGarminSyncedFallback
      );
    } catch (mutationError: any) {
      appToast.error(s.toastGarminSyncFailTitle, mutationError.message || s.toastGarminSyncFailBody);
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <PageTopBar
            backLabel={s.backToDashboard}
            rightContent={
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <ButtonSpinner />
                    {s.saving}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {s.save}
                  </>
                )}
              </button>
            }
          />
        </div>

        <section className="bg-surface rounded-xl border border-border p-5">
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">{s.pageTitle}</h1>
          <p className="text-text-secondary text-sm mt-1">{s.pageSubtitle}</p>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-8 space-y-4">
            <div className="bg-surface rounded-xl border border-border p-5">
              <AISectionHeader title={s.experienceTitle} subtitle={s.experienceSubtitle} />
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-sm font-semibold text-text-primary mb-1.5">{s.appLanguageTitle}</p>
                  <p className="text-xs text-text-secondary mb-3">{s.appLanguageSubtitle}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAppLocale('EN')}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        appLocale === 'EN'
                          ? 'border-primary-500/40 bg-primary-500/10 text-text-primary'
                          : 'border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {s.langEn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppLocale('PL')}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        appLocale === 'PL'
                          ? 'border-primary-500/40 bg-primary-500/10 text-text-primary'
                          : 'border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {s.langPl}
                    </button>
                  </div>
                  <div className="mt-3">
                    <EvoHintCard title={s.betaTag} tone="notice" content={s.appLanguageBeta} />
                  </div>
                </div>
                <ToggleRow
                  icon={<Bell className="h-4 w-4 text-info-500" />}
                  title={s.notificationsTitle}
                  description={s.notificationsDesc}
                  checked={notificationsEnabled}
                  onChange={setNotificationsEnabled}
                />
                <ToggleRow
                  icon={<MessageSquareMore className="h-4 w-4 text-success-500" />}
                  title={s.evoDockTitle}
                  description={s.evoDockDesc}
                  checked={evoDockEnabled}
                  onChange={setEvoDockEnabled}
                />
                <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-sm font-semibold text-text-primary mb-1.5">{s.coachingToneTitle}</p>
                  <p className="text-xs text-text-secondary mb-3">{s.coachingToneSubtitle}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {COACHING_TONE_OPTIONS.map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setCoachingTone(tone)}
                        className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                          coachingTone === tone
                            ? 'border-primary-500/40 bg-primary-500/10 text-text-primary'
                            : 'border-border text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {tone === 'GENTLE'
                          ? s.toneGentle
                          : tone === 'SUPPORTIVE'
                            ? s.toneSupportive
                            : tone === 'DIRECT'
                              ? s.toneDirect
                              : s.toneStrict}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-sm font-semibold text-text-primary mb-1.5">{s.proactivityTitle}</p>
                  <p className="text-xs text-text-secondary mb-3">{s.proactivitySubtitle}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setProactivityLevel(level)}
                        className={`rounded-md border px-3 py-2 text-xs transition-colors ${
                          proactivityLevel === level
                            ? 'border-primary-500/40 bg-primary-500/10 text-text-primary'
                            : 'border-border text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {level === 'LOW' ? s.proactivityLow : level === 'HIGH' ? s.proactivityHigh : s.proactivityMedium}
                      </button>
                    ))}
                  </div>
                </div>
                <EvoHintCard
                  title={s.previewToneTitle}
                  tone="notice"
                  content={
                    coachingTone === 'GENTLE'
                      ? s.previewToneGentle
                      : coachingTone === 'SUPPORTIVE'
                        ? s.previewToneSupportive
                        : coachingTone === 'DIRECT'
                          ? s.previewToneDirect
                          : s.previewToneStrict
                  }
                />
                <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-sm font-semibold text-text-primary mb-1.5">{s.bodyMetricsTitle}</p>
                  <p className="text-xs text-text-secondary mb-3">{s.bodyMetricsSubtitle}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor="weight-kg" className="block text-xs text-text-secondary mb-1">
                        {s.weightLabel}
                      </label>
                      <input
                        id="weight-kg"
                        type="number"
                        min={30}
                        max={300}
                        step={0.1}
                        value={weightKg}
                        onChange={(event) => setWeightKg(event.target.value)}
                        className="input-field w-full"
                        placeholder={s.weightPlaceholder}
                      />
                    </div>
                    <div>
                      <label htmlFor="height-cm" className="block text-xs text-text-secondary mb-1">
                        {s.heightLabel}
                      </label>
                      <input
                        id="height-cm"
                        type="number"
                        min={120}
                        max={260}
                        step={1}
                        value={heightCm}
                        onChange={(event) => setHeightCm(event.target.value)}
                        className="input-field w-full"
                        placeholder={s.heightPlaceholder}
                      />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{s.garminTitle}</p>
                      <p className="text-xs text-text-secondary mt-1">{s.garminSubtitle}</p>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] leading-none whitespace-nowrap ${
                        garminStatus?.connected
                          ? 'bg-success-500/15 text-success-300 border border-success-500/35'
                          : 'bg-border/40 text-text-secondary border border-border'
                      }`}
                    >
                      {garminStatus?.connected ? s.garminConnected : s.garminNotConnected}
                    </span>
                  </div>

                  {!garminStatus?.configured ? (
                    <p className="text-xs text-amber-300 mt-3">{s.garminEnvHint}</p>
                  ) : null}

                  <div className="mt-3 space-y-2.5">
                    <div>
                      <label htmlFor="garmin-token" className="block text-xs text-text-secondary mb-1">
                        {s.garminTokenLabel}
                      </label>
                      <input
                        id="garmin-token"
                        type="password"
                        value={garminToken}
                        onChange={(event) => setGarminToken(event.target.value)}
                        className="input-field w-full"
                        placeholder={s.garminTokenPlaceholder}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConnectGarmin}
                        disabled={connectingGarmin || stepSyncLoading || !garminStatus?.configured}
                        className="btn-secondary inline-flex items-center gap-2"
                      >
                        <Cable className="h-4 w-4" />
                        {connectingGarmin ? s.connectingGarmin : s.connectGarmin}
                      </button>
                      <button
                        type="button"
                        onClick={handleSyncGarminNow}
                        disabled={syncingGarmin || !garminStatus?.connected}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${syncingGarmin ? 'animate-spin' : ''}`} />
                        {syncingGarmin ? s.syncing : s.syncNow}
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectGarmin}
                        disabled={disconnectingGarmin || !garminStatus?.connected}
                        className="btn-ghost inline-flex items-center gap-2"
                      >
                        <Link2Off className="h-4 w-4" />
                        {s.disconnect}
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {s.lastSyncLabel}{' '}
                      <span className="text-text-primary">
                        {garminStatus?.lastSyncedAt
                          ? new Date(garminStatus.lastSyncedAt).toLocaleString()
                          : s.lastSyncNever}
                      </span>
                      {garminStatus?.usingEnvToken ? ` • ${s.usingServerToken}` : ''}
                    </p>
                    {garminStatus?.lastError ? (
                      <p className="text-xs text-red-300">
                        {s.lastErrorPrefix} {garminStatus.lastError}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-base font-semibold tracking-tight text-text-primary mb-4">{s.planSnapshotTitle}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <PlanPill label={s.pillPrimaryGoal} value={formatPrimaryGoal(String(user?.preferences?.primaryGoal || 'MAINTENANCE'))} />
                <PlanPill
                  label={s.pillCoachingTone}
                  value={formatCoachingTone(String(user?.preferences?.coachingTone || 'SUPPORTIVE'), s)}
                />
                <PlanPill
                  label={s.pillProactivity}
                  value={formatProactivity(String(user?.preferences?.proactivityLevel || 'MEDIUM'), s)}
                />
                <PlanPill label={s.pillRestingCalories} value={`${user?.preferences?.dailyCalorieGoal || 0} kcal`} />
                <PlanPill
                  label={s.pillBodyWeight}
                  value={user?.preferences?.weightKg ? `${user.preferences.weightKg} kg` : s.notSet}
                />
                <PlanPill
                  label={s.pillHeight}
                  value={user?.preferences?.heightCm ? `${user.preferences.heightCm} cm` : s.notSet}
                />
                <PlanPill label={s.pillProteinDay} value={`${user?.preferences?.proteinGoal || 0} g`} />
                <PlanPill
                  label={s.pillProteinSuggestion}
                  value={proteinSuggestionByWeight ? `${proteinSuggestionByWeight} g` : s.pillProteinSuggestionEmpty}
                />
                <PlanPill label={s.pillCarbsDay} value={`${user?.preferences?.carbsGoal || 0} g`} />
                <PlanPill label={s.pillFatDay} value={`${user?.preferences?.fatGoal || 0} g`} />
                <PlanPill label={s.pillWorkoutsWeek} value={`${user?.preferences?.weeklyWorkoutsGoal || 0}`} />
                <PlanPill label={s.pillActiveMinWeek} value={`${user?.preferences?.weeklyActiveMinutesGoal || 0} min`} />
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-base font-semibold tracking-tight text-text-primary mb-4">{s.quickDestTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <QuickLinkCard
                  onClick={() => router.push('/goals')}
                  icon={<Target className="mb-2 h-5 w-5 text-primary-500 stroke-[1.9]" />}
                  title={s.quickGoalTitle}
                  description={s.quickGoalDesc}
                />
                <QuickLinkCard
                  onClick={() => router.push('/stats')}
                  icon={<ChartColumnIncreasing className="mb-2 h-5 w-5 text-info-500 stroke-[1.9]" />}
                  title={s.quickStatsTitle}
                  description={s.quickStatsDesc}
                />
                <QuickLinkCard
                  onClick={() => router.push('/chat?channel=COACH')}
                  icon={<MessageSquareMore className="mb-2 h-5 w-5 text-success-500 stroke-[1.9]" />}
                  title={s.quickCoachTitle}
                  description={s.quickCoachDesc}
                />
                <QuickLinkCard
                  onClick={() => router.push('/workouts')}
                  icon={<Dumbbell className="mb-2 h-5 w-5 text-amber-400 stroke-[1.9]" />}
                  title={s.quickWorkoutsTitle}
                  description={s.quickWorkoutsDesc}
                />
              </div>
            </div>
          </section>

          <aside className="xl:col-span-4 space-y-4">
            <section className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold tracking-tight text-text-primary mb-3">{s.accountTitle}</h3>
              <div className="space-y-3">
                <InfoRow icon={<UserRound className="h-4 w-4 text-text-muted" />} label={s.nameLabel} value={user?.name || s.notSet} />
                <InfoRow icon={<ShieldCheck className="h-4 w-4 text-text-muted" />} label={s.emailLabel} value={user?.email || '—'} />
              </div>
            </section>

            <section className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold tracking-tight text-text-primary mb-3">{s.securityTitle}</h3>
              <div className="space-y-2">
                <button onClick={() => router.push('/forgot-password')} className="btn-secondary w-full">
                  {s.resetPassword}
                </button>
                <button onClick={handleLogout} className="w-full inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-md border border-red-400/30 text-red-300 hover:text-red-200 hover:border-red-300/50 transition-colors">
                  <LogOut className="h-4 w-4" />
                  {s.logout}
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-2">
          {icon}
          <p className="text-sm font-semibold text-text-primary">{title}</p>
        </div>
        <p className="text-xs text-text-secondary mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-500' : 'bg-border'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function PlanPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-text-primary mt-1">{value}</p>
    </div>
  );
}

function QuickLinkCard({
  onClick,
  icon,
  title,
  description,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-surface-elevated border border-border rounded-lg p-3.5 text-left hover:border-primary-500/30 transition-colors duration-150 ease-out"
    >
      {icon}
      <p className="font-semibold text-text-primary">{title}</p>
      <p className="text-sm text-text-secondary">{description}</p>
    </button>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3">
      <div className="inline-flex items-center gap-2 text-xs text-text-muted">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold text-text-primary mt-1 break-all">{value}</p>
    </div>
  );
}

function formatCoachingTone(value: string, s: (typeof settingsPageStrings)['en']) {
  const u = String(value || '').toUpperCase();
  if (u === 'GENTLE') return s.coachingToneDisplayGentle;
  if (u === 'DIRECT') return s.coachingToneDisplayDirect;
  if (u === 'STRICT') return s.coachingToneDisplayStrict;
  return s.coachingToneDisplaySupportive;
}

function formatProactivity(value: string, s: (typeof settingsPageStrings)['en']) {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'LOW') return s.proactivityDisplayLow;
  if (normalized === 'HIGH') return s.proactivityDisplayHigh;
  return s.proactivityDisplayMedium;
}
