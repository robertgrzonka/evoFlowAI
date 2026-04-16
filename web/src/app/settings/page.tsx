'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChartColumnIncreasing,
  Dumbbell,
  MessageSquareMore,
  Target,
} from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <AppShell>
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.9]" />
            Back to dashboard
          </Link>
        </div>

        <section className="bg-surface rounded-xl border border-border p-5">
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">Settings</h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage your goals and app preferences.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
            <button
              onClick={() => router.push('/goals')}
              className="bg-surface-elevated border border-border rounded-lg p-3.5 text-left hover:border-primary-500/30 transition-colors duration-150 ease-out"
            >
              <Target className="mb-2 h-5 w-5 text-primary-500 stroke-[1.9]" />
              <p className="font-semibold text-text-primary">Goal Settings</p>
              <p className="text-sm text-text-secondary">Calories, activity and macro targets.</p>
            </button>

            <button
              onClick={() => router.push('/stats')}
              className="bg-surface-elevated border border-border rounded-lg p-3.5 text-left hover:border-info-500/30 transition-colors duration-150 ease-out"
            >
              <ChartColumnIncreasing className="mb-2 h-5 w-5 text-info-500 stroke-[1.9]" />
              <p className="font-semibold text-text-primary">Stats View</p>
              <p className="text-sm text-text-secondary">Open day-by-day nutrition stats.</p>
            </button>

            <button
              onClick={() => router.push('/chat')}
              className="bg-surface-elevated border border-border rounded-lg p-3.5 text-left hover:border-success-500/30 transition-colors duration-150 ease-out"
            >
              <MessageSquareMore className="mb-2 h-5 w-5 text-success-500 stroke-[1.9]" />
              <p className="font-semibold text-text-primary">AI Coach</p>
              <p className="text-sm text-text-secondary">Chat and meal logging with AI.</p>
            </button>

            <button
              onClick={() => router.push('/workouts')}
              className="bg-surface-elevated border border-border rounded-lg p-3.5 text-left hover:border-amber-400/30 transition-colors duration-150 ease-out"
            >
              <Dumbbell className="mb-2 h-5 w-5 text-amber-400 stroke-[1.9]" />
              <p className="font-semibold text-text-primary">Workout Coach</p>
              <p className="text-sm text-text-secondary">Log training and get food recovery guidance.</p>
            </button>
          </div>
        </section>
    </AppShell>
  );
}
