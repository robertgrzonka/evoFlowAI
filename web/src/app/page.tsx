'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Camera,
  ChartColumnIncreasing,
  Dumbbell,
  MessageSquareMore,
  Target,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { hasAuthToken } from '@/lib/auth-token';
import EvoMark from '@/components/EvoMark';

const productPillars = [
  { icon: Target, title: 'Goal Modes', desc: 'Deficyt, maintenance, muscle gain, strength.' },
  { icon: Camera, title: 'Meals', desc: 'Opis lub zdjęcie + szybka analiza makro.' },
  { icon: Dumbbell, title: 'Workouts', desc: 'Treningi, minuty, spalanie i kontekst dnia.' },
  { icon: MessageSquareMore, title: 'Evo Coach', desc: 'AI wsparcie z personalizacją tonu i proaktywności.' },
  { icon: ChartColumnIncreasing, title: 'Stats Views', desc: 'Tryby: nutrition, training, combined.' },
  { icon: TrendingUp, title: 'Weekly Review', desc: 'Ocena tygodnia i konkretne next steps.' },
];

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (hasAuthToken()) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-surface to-background">
      <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <EvoMark className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-tight text-gradient">evoFlowAI</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Link href="/login" className="btn-ghost">Login</Link>
            <Link href="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="rounded-2xl border border-border bg-surface p-6 md:p-8"
          >
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-primary-300 mb-4">
                AI nutrition + training copilot
              </p>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary mb-4">
                One app to run your daily calories, goals and coaching flow with Evo.
              </h1>
              <p className="text-text-secondary text-base md:text-lg max-w-2xl">
                Log meals and workouts in seconds, get dynamic daily guidance, and review your full week with clear AI recommendations.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link href="/register" className="btn-primary inline-flex items-center h-10 px-4">
                  Start now
                  <ArrowRight className="ml-2 h-4 w-4 stroke-[1.9]" />
                </Link>
                <Link href="/demo" className="btn-secondary inline-flex items-center h-10 px-4">
                  See demo
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">Built for real coaching workflows</h2>
            <p className="text-text-secondary mt-1">Everything aligned to your daily execution and weekly decisions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {productPillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border bg-surface-elevated p-4"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border mb-3">
                  <pillar.icon className="h-4 w-4 text-text-primary" />
                </div>
                <h3 className="font-semibold text-text-primary">{pillar.title}</h3>
                <p className="text-sm text-text-secondary mt-1">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
