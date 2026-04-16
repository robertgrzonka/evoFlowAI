'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import {
  ArrowLeft,
  Bell,
  ChartColumnIncreasing,
  Dumbbell,
  LogOut,
  MessageSquareMore,
  Save,
  ShieldCheck,
  Target,
  UserRound,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { ME_QUERY } from '@/lib/graphql/queries';
import { UPDATE_PREFERENCES_MUTATION } from '@/lib/graphql/mutations';
import { clearAuthToken } from '@/lib/auth-token';
import { ButtonSpinner, PageLoader } from '@/components/ui/loading';
import { appToast } from '@/lib/app-toast';

export default function SettingsPage() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [evoDockEnabled, setEvoDockEnabled] = useState(true);

  const { data, loading, error } = useQuery(ME_QUERY);
  const [updatePreferences, { loading: saving }] = useMutation(UPDATE_PREFERENCES_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (!data?.me?.preferences) return;
    setNotificationsEnabled(Boolean(data.me.preferences.notifications));
  }, [data]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('evoflowai_evo_dock_enabled');
    setEvoDockEnabled(raw === null ? true : raw !== 'false');
  }, []);

  useEffect(() => {
    if (!error) return;
    appToast.error('Session expired', 'Please log in again.');
    clearAuthToken();
    router.push('/login');
  }, [error, router]);

  const handleSaveSettings = async () => {
    try {
      await updatePreferences({
        variables: {
          input: {
            notifications: notificationsEnabled,
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

  const handleLogout = () => {
    clearAuthToken();
    router.push('/');
  };

  if (loading) {
    return <PageLoader />;
  }

  const user = data?.me;

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.9]" />
            Back to dashboard
          </Link>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <ButtonSpinner />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save settings
              </>
            )}
          </button>
        </div>

        <section className="bg-surface rounded-xl border border-border p-5">
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">Settings</h1>
          <p className="text-text-secondary text-sm mt-1">
            Configure account experience, Evo assistant behavior, and quick access tools.
          </p>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-8 space-y-4">
            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-base font-semibold tracking-tight text-text-primary mb-4">Experience settings</h2>
              <div className="space-y-3">
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
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-base font-semibold tracking-tight text-text-primary mb-4">Current plan snapshot</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <PlanPill label="Calories / day" value={`${user?.preferences?.dailyCalorieGoal || 0} kcal`} />
                <PlanPill label="Protein / day" value={`${user?.preferences?.proteinGoal || 0} g`} />
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
                  onClick={() => router.push('/chat')}
                  icon={<MessageSquareMore className="mb-2 h-5 w-5 text-success-500 stroke-[1.9]" />}
                  title="AI Coach"
                  description="Chat and log meals with Evo."
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
