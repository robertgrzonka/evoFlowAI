'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  MessageSquareMore,
  NotebookPen,
  Settings,
  Target,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ME_QUERY } from '@/lib/graphql/queries';
import { appShellStrings } from '@/lib/i18n/app-shell-strings';
import { graphqlAppLocaleToUi } from '@/lib/i18n/ui-locale';
import { clearAuthToken } from '@/lib/auth-token';
import { clearApolloClientCache } from '@/lib/apollo-client';
import EvoMark from '@/components/EvoMark';
import EvoChatDock from '@/components/EvoChatDock';
import ProBadge from '@/components/ui/atoms/ProBadge';
import Tooltip from '@/components/ui/atoms/Tooltip';
import { AppShellLayoutProvider, useAppShellLayout } from '@/components/app-shell-layout';
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

function AppShellInner({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useQuery(ME_QUERY, { fetchPolicy: 'cache-first' });
  const user = data?.me;
  const uiLocale = graphqlAppLocaleToUi(user?.preferences?.appLocale);
  const t = appShellStrings[uiLocale];
  const [evoDockEnabled, setEvoDockEnabled] = useState(true);
  const { sidebarCollapsed, toggleSidebar } = useAppShellLayout();

  const navItems: NavItem[] = useMemo(
    () => [
      { href: '/dashboard', label: t.navDashboard, icon: LayoutDashboard },
      { href: '/chat', label: t.navChat, icon: MessageSquareMore },
      { href: '/meals', label: t.navMeals, icon: NotebookPen },
      { href: '/stats', label: t.navStats, icon: BarChart3 },
      { href: '/workouts', label: t.navWorkouts, icon: Dumbbell },
      { href: '/goals', label: t.navGoals, icon: Target },
      { href: '/settings', label: t.navSettings, icon: Settings },
    ],
    [t]
  );

  const coachProNavItem: NavItem = useMemo(
    () => ({ href: '/coach-pro', label: t.navCoachPro, premium: true }),
    [t]
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = uiLocale === 'pl' ? 'pl' : 'en';
  }, [uiLocale]);

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

  const handleLogout = async () => {
    clearAuthToken();
    await clearApolloClientCache();
    router.push('/');
  };

  const userInitial = (user?.name?.trim()?.[0] || user?.email?.trim()?.[0] || '?').toUpperCase();

  const linkBase = (active: boolean, premium?: boolean) =>
    clsx(
      'flex items-center rounded-md text-sm transition-colors duration-150 border',
      sidebarCollapsed ? 'mx-auto justify-center px-0 h-11 w-11 min-h-[2.75rem] min-w-[2.75rem] shrink-0' : 'gap-2.5 px-3 py-2 w-full',
      active
        ? premium
          ? 'bg-amber-300/10 border-amber-300/45 text-amber-100'
          : 'bg-primary-500/12 border-primary-500/25 text-text-primary'
        : premium
          ? 'text-amber-100/90 hover:text-amber-100 hover:bg-amber-300/5 border-amber-300/35'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated border-transparent'
    );

  const renderNavLink = (item: NavItem) => {
    const Icon = item.icon;
    if (!Icon) return null;
    const active = pathname === item.href;
    const link = (
      <Link
        href={item.href}
        className={linkBase(active, item.premium)}
        aria-current={active ? 'page' : undefined}
        aria-label={item.premium ? `${item.label} premium navigation` : item.label}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className={clsx(sidebarCollapsed && 'sr-only')}>{item.label}</span>
        {!sidebarCollapsed && item.premium ? (
          <span className="ml-auto">
            <ProBadge />
          </span>
        ) : null}
      </Link>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip key={item.href} content={item.label} rail>
          {link}
        </Tooltip>
      );
    }
    return <Fragment key={item.href}>{link}</Fragment>;
  };

  const coachProActive = pathname === coachProNavItem.href;
  const coachProLink = (
    <Link
      href={coachProNavItem.href}
      className={linkBase(coachProActive, true)}
      aria-current={coachProActive ? 'page' : undefined}
      aria-label={`${coachProNavItem.label} premium navigation`}
    >
      <EvoMark className={clsx('h-4 w-4 text-amber-200 shrink-0', !sidebarCollapsed && 'translate-y-[1px]')} />
      <span className={clsx(sidebarCollapsed && 'sr-only')}>{coachProNavItem.label}</span>
      {!sidebarCollapsed ? (
        <span className="ml-auto">
          <ProBadge />
        </span>
      ) : null}
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <div
        className={clsx(
          'lg:grid transition-[grid-template-columns] duration-200 ease-out',
          sidebarCollapsed ? 'lg:grid-cols-[72px_minmax(0,1fr)]' : 'lg:grid-cols-[248px_minmax(0,1fr)]'
        )}
      >
        <aside
          id="app-shell-sidebar"
          className={clsx(
            'hidden lg:flex lg:sticky lg:top-0 h-screen flex-col border-r border-border transition-[padding] duration-200 ease-out z-50 overflow-visible',
            sidebarCollapsed ? 'px-2 py-4' : 'px-4 py-4'
          )}
        >
          <div
            className={clsx(
              'flex shrink-0 w-full',
              sidebarCollapsed ? 'flex-col-reverse items-center gap-2.5' : 'items-center justify-between gap-2'
            )}
          >
            {!sidebarCollapsed ? (
              <Link href="/dashboard" className="inline-flex min-w-0 items-end gap-1.5 px-2 py-2">
                <EvoMark className="h-5 w-5 shrink-0 text-primary-500 translate-y-[1px]" />
                <span className="font-semibold tracking-tight leading-none text-gradient truncate">evoFlowAI</span>
              </Link>
            ) : (
              <Tooltip content={t.navDashboard} rail>
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-transparent hover:bg-surface-elevated transition-colors"
                  aria-label={t.navDashboard}
                >
                  <EvoMark className="h-6 w-6 text-primary-500" />
                </Link>
              </Tooltip>
            )}
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
              aria-expanded={!sidebarCollapsed}
              aria-controls="app-shell-sidebar"
              title={sidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
            >
              {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>

          <nav className="mt-3 space-y-1 flex-1 overflow-y-auto overflow-x-visible min-h-0">
            {navItems.map((item) => renderNavLink(item))}
            <div className={clsx('pt-3 mt-3 border-t border-border', sidebarCollapsed && 'space-y-1')}>
              {sidebarCollapsed ? (
                <Tooltip content={coachProNavItem.label} rail>
                  {coachProLink}
                </Tooltip>
              ) : (
                coachProLink
              )}
            </div>
          </nav>

          <div
            className={clsx(
              'mt-3 rounded-lg border border-border bg-surface shrink-0',
              sidebarCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3'
            )}
          >
            {!sidebarCollapsed ? (
              <>
                <p className="text-xs text-text-muted">{t.loggedInAs}</p>
                <p className="text-sm text-text-primary mt-1 truncate w-full text-center">{user?.name || user?.email || 'User'}</p>
              </>
            ) : (
              <Tooltip content={t.userMenuHint} side="bottom" rail>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated text-xs font-semibold text-text-primary"
                  aria-hidden
                >
                  {userInitial}
                </div>
              </Tooltip>
            )}
            {sidebarCollapsed ? (
              <Tooltip content={t.logout} side="bottom" rail>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-secondary inline-flex h-9 w-9 items-center justify-center px-0"
                  aria-label={t.logout}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </Tooltip>
            ) : (
              <button type="button" onClick={handleLogout} className="btn-secondary w-full mt-3 inline-flex items-center justify-center gap-2">
                <LogOut className="h-4 w-4" />
                {t.logout}
              </button>
            )}
          </div>
        </aside>

        <div className="min-w-0 relative z-10 bg-background">
          <header className="lg:hidden border-b border-border bg-surface">
            <div className="px-4 py-3 flex items-center justify-between">
              <Link href="/dashboard" className="inline-flex items-end gap-1.5">
                <EvoMark className="h-5 w-5 text-primary-500 translate-y-[1px]" />
                <span className="font-semibold tracking-tight leading-none text-gradient">evoFlowAI</span>
              </Link>
              <button type="button" onClick={handleLogout} className="btn-secondary inline-flex items-center justify-center w-9 px-0">
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

          <main
            className={clsx(
              'mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full transition-[max-width] duration-200 ease-out',
              /* Wider canvas: weekly grids need horizontal room; collapsed rail frees ~176px vs expanded. */
              sidebarCollapsed
                ? 'max-w-[min(140rem,calc(100vw-5rem))]'
                : 'max-w-[min(104rem,calc(100vw-1rem))]'
            )}
          >
            {children}
          </main>
        </div>
      </div>
      <EvoChatDock hidden={pathname === '/chat' || !evoDockEnabled} />
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <AppShellLayoutProvider>
      <AppShellInner>{children}</AppShellInner>
    </AppShellLayoutProvider>
  );
}
