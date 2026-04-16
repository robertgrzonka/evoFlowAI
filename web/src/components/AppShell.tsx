'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import {
  BarChart3,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Settings,
  Target,
} from 'lucide-react';
import { ME_QUERY } from '@/lib/graphql/queries';
import { clearAuthToken } from '@/lib/auth-token';
import EvoMark from '@/components/EvoMark';

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Log Meal', icon: NotebookPen },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useQuery(ME_QUERY, { fetchPolicy: 'cache-first' });
  const user = data?.me;

  const handleLogout = () => {
    clearAuthToken();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden lg:flex lg:sticky lg:top-0 h-screen flex-col border-r border-border px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-end gap-1.5 px-2 py-2">
            <EvoMark className="h-5 w-5 text-primary-500 translate-y-[1px]" />
            <span className="font-semibold tracking-tight leading-none text-text-primary">evoFlowAI</span>
          </Link>

          <nav className="mt-6 space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150 ${
                    active
                      ? 'bg-primary-500/12 border border-primary-500/25 text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-text-muted">Logged in as</p>
            <p className="text-sm text-text-primary mt-1 truncate">{user?.name || user?.email || 'User'}</p>
            <button onClick={handleLogout} className="btn-secondary w-full mt-3 inline-flex items-center justify-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="lg:hidden border-b border-border bg-surface">
            <div className="px-4 py-3 flex items-center justify-between">
              <Link href="/dashboard" className="inline-flex items-end gap-1.5">
                <EvoMark className="h-5 w-5 text-primary-500 translate-y-[1px]" />
                <span className="font-semibold tracking-tight leading-none text-text-primary">evoFlowAI</span>
              </Link>
              <button onClick={handleLogout} className="btn-secondary inline-flex items-center justify-center w-9 px-0">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <nav className="px-2 pb-2 flex gap-1 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap ${
                      active
                        ? 'bg-primary-500/12 border border-primary-500/25 text-text-primary'
                        : 'text-text-secondary border border-transparent'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
