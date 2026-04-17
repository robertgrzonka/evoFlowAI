'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import {
  BarChart3,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  MessageSquareMore,
  NotebookPen,
  Settings,
  Target,
} from 'lucide-react';
import { ME_QUERY } from '@/lib/graphql/queries';
import { clearAuthToken } from '@/lib/auth-token';
import EvoMark from '@/components/EvoMark';
import EvoChatDock from '@/components/EvoChatDock';
import ProBadge from '@/components/ui/atoms/ProBadge';
import type { LucideIcon } from 'lucide-react';

type AppShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  premium?: boolean;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Evo Chat', icon: MessageSquareMore },
  { href: '/meals', label: 'Meals', icon: NotebookPen },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const coachProNavItem: NavItem = { href: '/coach-pro', label: 'Evo Coach Pro', premium: true };

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useQuery(ME_QUERY, { fetchPolicy: 'cache-first' });
  const user = data?.me;
  const [evoDockEnabled, setEvoDockEnabled] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const readPreference = () => {
      const raw = localStorage.getItem('evoflowai_evo_dock_enabled');
      if (raw === null) {
        setEvoDockEnabled(true);
        return;
      }
      setEvoDockEnabled(raw !== 'false');
    };

    readPreference();
    window.addEventListener('storage', readPreference);
    window.addEventListener('evo-settings-updated', readPreference);

    return () => {
      window.removeEventListener('storage', readPreference);
      window.removeEventListener('evo-settings-updated', readPreference);
    };
  }, []);

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
            <span className="font-semibold tracking-tight leading-none text-gradient">evoFlowAI</span>
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
                      ? item.premium
                        ? 'bg-amber-300/10 border border-amber-300/45 text-amber-100'
                        : 'bg-primary-500/12 border border-primary-500/25 text-text-primary'
                      : item.premium
                        ? 'text-amber-100/90 hover:text-amber-100 hover:bg-amber-300/5 border border-amber-300/35'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent'
                  }`}
                  aria-label={item.premium ? `${item.label} premium navigation` : item.label}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.premium ? (
                    <span className="ml-auto">
                      <ProBadge />
                    </span>
                  ) : null}
                </Link>
              );
            })}
            <div className="pt-3 mt-3 border-t border-border">
              {(() => {
                const active = pathname === coachProNavItem.href;
                return (
                  <Link
                    href={coachProNavItem.href}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150 ${
                      active
                        ? 'bg-amber-300/10 border border-amber-300/45 text-amber-100'
                        : 'text-amber-100/90 hover:text-amber-100 hover:bg-amber-300/5 border border-amber-300/35'
                    }`}
                    aria-label={`${coachProNavItem.label} premium navigation`}
                  >
                    <EvoMark className="h-4 w-4 text-amber-200 translate-y-[1px]" />
                    <span>{coachProNavItem.label}</span>
                    <span className="ml-auto">
                      <ProBadge />
                    </span>
                  </Link>
                );
              })()}
            </div>
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
                <span className="font-semibold tracking-tight leading-none text-gradient">evoFlowAI</span>
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
                        ? item.premium
                          ? 'bg-amber-300/10 border border-amber-300/45 text-amber-100'
                          : 'bg-primary-500/12 border border-primary-500/25 text-text-primary'
                        : item.premium
                          ? 'text-amber-100/90 border border-amber-300/35'
                          : 'text-text-secondary border border-transparent'
                    }`}
                    aria-label={item.premium ? `${item.label} premium navigation` : item.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                    {item.premium ? <ProBadge compact /> : null}
                  </Link>
                );
              })}
              <Link
                href={coachProNavItem.href}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap ${
                  pathname === coachProNavItem.href
                    ? 'bg-amber-300/10 border border-amber-300/45 text-amber-100'
                    : 'text-amber-100/90 border border-amber-300/35'
                }`}
                aria-label={`${coachProNavItem.label} premium navigation`}
              >
                <EvoMark className="h-3.5 w-3.5 text-amber-200 translate-y-[1px]" />
                {coachProNavItem.label}
                <ProBadge compact />
              </Link>
            </nav>
          </header>

          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
        </div>
      </div>
      <EvoChatDock hidden={pathname === '/chat' || !evoDockEnabled} />
    </div>
  );
}
