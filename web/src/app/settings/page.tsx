'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
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
import { buildDayRefetchQueries } from '@/lib/day-data';
import { formatPrimaryGoal } from '@/lib/formatters';
import { AISectionHeader, EvoHintCard } from '@/components/evo';
import { settingsPageStrings } from '@/lib/i18n/settings-strings';
import { graphqlAppLocaleToUi } from '@/lib/i18n/ui-locale';

export default function SettingsPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [evoDockEnabled, setEvoDockEnabled] = useState(true);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [coachingTone, setCoachingTone] = useState<'SUPPORTIVE' | 'DIRECT'>('SUPPORTIVE');
  const [proactivityLevel, setProactivityLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [appLocale, setAppLocale] = useState<'EN' | 'PL'>('EN');
  const [garminToken, setGarminToken] = useState('');

  const { data, loading, error } = useQuery(ME_QUERY);
  const { data: stepSyncData, loading: stepSyncLoading, refetch: refetchStepSync } = useQuery(STEP_SYNC_STATUS_QUERY, {
    variables: { provider: 'GARMIN' },
  });
  const [updatePreferences, { loading: saving }] = useMutation(UPDATE_PREFERENCES_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }, ...buildDayRefetchQueries(today)],
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
    setCoachingTone(String(data.me.preferences.coachingTone || 'SUPPORTIVE').toUpperCase() as 'SUPPORTIVE' | 'DIRECT');
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
    appToast.error('Session expired', 'Please log in again.');
    void (async () => {
      clearAuthToken();
      await clearApolloClientCache();
      router.push('/login');
    })();
  }, [error, router]);

  const handleSaveSettings = async () => {
    const parsedWeight = weightKg.trim() === '' ? null : Number(weightKg);
    const parsedHeight = heightCm.trim() === '' ? null : Number(heightCm);

    if (parsedWeight !== null && (!Number.isFinite(parsedWeight) || parsedWeight < 30 || parsedWeight > 300)) {
      appToast.warning('Invalid weight', 'Weight must be between 30 and 300 kg.');
      return;
    }

    if (parsedHeight !== null && (!Number.isFinite(parsedHeight) || parsedHeight < 120 || parsedHeight > 260)) {
      appToast.warning('Invalid height', 'Height must be between 120 and 260 cm.');
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
      }
      appToast.success('Settings saved', 'Your app preferences were updated.');
    } catch (mutationError: any) {
      appToast.error('Save failed', mutationError.message || 'Could not save settings.');
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
  const s = settingsPageStrings[graphqlAppLocaleToUi(appLocale)];
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
      appToast.success('Garmin connected', 'Step sync is enabled for your account.');
    } catch (mutationError: any) {
      appToast.error('Garmin connect failed', mutationError.message || 'Could not connect Garmin.');
    }
  };

  const handleDisconnectGarmin = async () => {
    try {
      await disconnectStepSync({ variables: { provider: 'GARMIN' } });
      await refetchStepSync();
      appToast.success('Garmin disconnected', 'Automatic step sync is disabled.');
    } catch (mutationError: any) {
      appToast.error('Disconnect failed', mutationError.message || 'Could not disconnect Garmin.');
    }
  };

  const handleSyncGarminNow = async () => {
    try {
      const result = await syncGarminSteps({ variables: { date: today } });
      await refetchStepSync();
      const payload = result.data?.syncGarminSteps;
      appToast.success(
        'Garmin synced',
        payload
          ? `Imported ${payload.importedSteps} steps for ${payload.date}. Saved ${payload.savedSteps} steps in your day snapshot.`
          : 'Steps were synced successfully.'
      );
    } catch (mutationError: any) {
      appToast.error('Sync failed', mutationError.message || 'Could not sync Garmin steps.');
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
                  title="Notifications"
                  description="Enable in-app guidance and important account feedback."
                  checked={notificationsEnabled}
                  onChange={setNotificationsEnabled}
                />
                <ToggleRow
                  icon={<MessageSquareMore className="h-4 w-4 text-success-500" />}
                  title="Floating Evo Chat"
                  description="Show minimized Evo messenger dock across authenticated pages."
                  checked={evoDockEnabled}
                  onChange={setEvoDockEnabled}
                />
                <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-sm font-semibold text-text-primary mb-1.5">Evo coaching tone</p>
                  <p className="text-xs text-text-secondary mb-3">This changes communication style, not Evo personality.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCoachingTone('SUPPORTIVE')}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        coachingTone === 'SUPPORTIVE'
                          ? 'border-primary-500/40 bg-primary-500/10 text-text-primary'
                          : 'border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Supportive
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoachingTone('DIRECT')}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        coachingTone === 'DIRECT'
                          ? 'border-primary-500/40 bg-primary-500/10 text-text-primary'
                          : 'border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Direct
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-sm font-semibold text-text-primary mb-1.5">Evo proactivity</p>
                  <p className="text-xs text-text-secondary mb-3">How often Evo should interrupt with next-step suggestions.</p>
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
                        {level.charAt(0) + level.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <EvoHintCard
                  title="Preview tone"
                  tone="notice"
                  content={
                    coachingTone === 'DIRECT'
                      ? 'Direct: Evo keeps feedback tight and task-focused.'
                      : 'Supportive: Evo stays warm, but still practical and concrete.'
                  }
                />
                <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-sm font-semibold text-text-primary mb-1.5">Body metrics for AI guidance</p>
                  <p className="text-xs text-text-secondary mb-3">
                    Evo uses this to suggest protein intake (default: about 2.0 g per kg body weight).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor="weight-kg" className="block text-xs text-text-secondary mb-1">Weight (kg)</label>
                      <input
                        id="weight-kg"
                        type="number"
                        min={30}
                        max={300}
                        step={0.1}
                        value={weightKg}
                        onChange={(event) => setWeightKg(event.target.value)}
                        className="input-field w-full"
                        placeholder="e.g. 78"
                      />
                    </div>
                    <div>
                      <label htmlFor="height-cm" className="block text-xs text-text-secondary mb-1">Height (cm)</label>
                      <input
                        id="height-cm"
                        type="number"
                        min={120}
                        max={260}
                        step={1}
                        value={heightCm}
                        onChange={(event) => setHeightCm(event.target.value)}
                        className="input-field w-full"
                        placeholder="e.g. 180"
                      />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Garmin step sync (Beta connector)</p>
                      <p className="text-xs text-text-secondary mt-1">
                        Prototype connector for Garmin-like endpoints. For production, use official Garmin approval or file import.
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] leading-none whitespace-nowrap ${
                        garminStatus?.connected
                          ? 'bg-success-500/15 text-success-300 border border-success-500/35'
                          : 'bg-border/40 text-text-secondary border border-border'
                      }`}
                    >
                      {garminStatus?.connected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>

                  {!garminStatus?.configured ? (
                    <p className="text-xs text-amber-300 mt-3">
                      Garmin endpoint is not configured on server. Set <code>GARMIN_DAILY_STEPS_ENDPOINT</code> in backend env.
                    </p>
                  ) : null}

                  <div className="mt-3 space-y-2.5">
                    <div>
                      <label htmlFor="garmin-token" className="block text-xs text-text-secondary mb-1">
                        Garmin API token (optional when server has GARMIN_API_TOKEN)
                      </label>
                      <input
                        id="garmin-token"
                        type="password"
                        value={garminToken}
                        onChange={(event) => setGarminToken(event.target.value)}
                        className="input-field w-full"
                        placeholder="Paste Garmin token only if needed"
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
                        {connectingGarmin ? 'Connecting...' : 'Connect Garmin'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSyncGarminNow}
                        disabled={syncingGarmin || !garminStatus?.connected}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${syncingGarmin ? 'animate-spin' : ''}`} />
                        {syncingGarmin ? 'Syncing...' : 'Sync now'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectGarmin}
                        disabled={disconnectingGarmin || !garminStatus?.connected}
                        className="btn-ghost inline-flex items-center gap-2"
                      >
                        <Link2Off className="h-4 w-4" />
                        Disconnect
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary">
                      Last sync:{' '}
                      <span className="text-text-primary">
                        {garminStatus?.lastSyncedAt
                          ? new Date(garminStatus.lastSyncedAt).toLocaleString()
                          : 'Never'}
                      </span>
                      {garminStatus?.usingEnvToken ? ' • using server token' : ''}
                    </p>
                    {garminStatus?.lastError ? (
                      <p className="text-xs text-red-300">Last error: {garminStatus.lastError}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-base font-semibold tracking-tight text-text-primary mb-4">Current plan snapshot</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <PlanPill label="Primary goal" value={formatPrimaryGoal(String(user?.preferences?.primaryGoal || 'MAINTENANCE'))} />
                <PlanPill label="Coaching tone" value={formatCoachingTone(String(user?.preferences?.coachingTone || 'SUPPORTIVE'))} />
                <PlanPill label="Proactivity" value={formatProactivity(String(user?.preferences?.proactivityLevel || 'MEDIUM'))} />
                <PlanPill label="Resting calories (base)" value={`${user?.preferences?.dailyCalorieGoal || 0} kcal`} />
                <PlanPill label="Body weight" value={user?.preferences?.weightKg ? `${user.preferences.weightKg} kg` : 'Not set'} />
                <PlanPill label="Height" value={user?.preferences?.heightCm ? `${user.preferences.heightCm} cm` : 'Not set'} />
                <PlanPill label="Protein / day" value={`${user?.preferences?.proteinGoal || 0} g`} />
                <PlanPill
                  label="Protein suggestion (2g/kg)"
                  value={proteinSuggestionByWeight ? `${proteinSuggestionByWeight} g` : 'Add weight to calculate'}
                />
                <PlanPill label="Carbs / day" value={`${user?.preferences?.carbsGoal || 0} g`} />
                <PlanPill label="Fat / day" value={`${user?.preferences?.fatGoal || 0} g`} />
                <PlanPill label="Workouts / week" value={`${user?.preferences?.weeklyWorkoutsGoal || 0}`} />
                <PlanPill label="Active minutes / week" value={`${user?.preferences?.weeklyActiveMinutesGoal || 0} min`} />
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-base font-semibold tracking-tight text-text-primary mb-4">Quick destinations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <QuickLinkCard
                  onClick={() => router.push('/goals')}
                  icon={<Target className="mb-2 h-5 w-5 text-primary-500 stroke-[1.9]" />}
                  title="Goal Settings"
                  description="Calories, macros and training targets."
                />
                <QuickLinkCard
                  onClick={() => router.push('/stats')}
                  icon={<ChartColumnIncreasing className="mb-2 h-5 w-5 text-info-500 stroke-[1.9]" />}
                  title="Stats View"
                  description="Review nutrition progress by date."
                />
                <QuickLinkCard
                  onClick={() => router.push('/chat?channel=COACH')}
                  icon={<MessageSquareMore className="mb-2 h-5 w-5 text-success-500 stroke-[1.9]" />}
                  title="AI Coach"
                  description="Open Evo general or coach conversation."
                />
                <QuickLinkCard
                  onClick={() => router.push('/workouts')}
                  icon={<Dumbbell className="mb-2 h-5 w-5 text-amber-400 stroke-[1.9]" />}
                  title="Workout Coach"
                  description="Track training and recovery guidance."
                />
              </div>
            </div>
          </section>

          <aside className="xl:col-span-4 space-y-4">
            <section className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold tracking-tight text-text-primary mb-3">Account</h3>
              <div className="space-y-3">
                <InfoRow icon={<UserRound className="h-4 w-4 text-text-muted" />} label="Name" value={user?.name || 'Not set'} />
                <InfoRow icon={<ShieldCheck className="h-4 w-4 text-text-muted" />} label="Email" value={user?.email || 'Unknown'} />
              </div>
            </section>

            <section className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold tracking-tight text-text-primary mb-3">Security</h3>
              <div className="space-y-2">
                <button onClick={() => router.push('/forgot-password')} className="btn-secondary w-full">
                  Reset password
                </button>
                <button onClick={handleLogout} className="w-full inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-md border border-red-400/30 text-red-300 hover:text-red-200 hover:border-red-300/50 transition-colors">
                  <LogOut className="h-4 w-4" />
                  Logout
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

function formatCoachingTone(value: string) {
  return String(value || '').toUpperCase() === 'DIRECT' ? 'Direct' : 'Supportive';
}

function formatProactivity(value: string) {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'LOW') return 'Low';
  if (normalized === 'HIGH') return 'High';
  return 'Medium';
}
