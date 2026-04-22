'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'evoflowai_sidebar_collapsed';

export type AppShellLayoutContextValue = {
  /** Desktop (lg+) sidebar shows icons only; main column is wider. */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
};

const AppShellLayoutContext = createContext<AppShellLayoutContextValue | null>(null);

function readStoredCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function AppShellLayoutProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);

  useEffect(() => {
    setSidebarCollapsedState(readStoredCollapsed());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setSidebarCollapsedState(readStoredCollapsed());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setSidebarCollapsed = useCallback((value: boolean) => {
    setSidebarCollapsedState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ sidebarCollapsed, setSidebarCollapsed, toggleSidebar }),
    [sidebarCollapsed, setSidebarCollapsed, toggleSidebar]
  );

  return <AppShellLayoutContext.Provider value={value}>{children}</AppShellLayoutContext.Provider>;
}

/** Safe outside AppShell: returns expanded defaults and no-op setters. */
export function useAppShellLayout(): AppShellLayoutContextValue {
  const ctx = useContext(AppShellLayoutContext);
  if (!ctx) {
    return {
      sidebarCollapsed: false,
      setSidebarCollapsed: () => {},
      toggleSidebar: () => {},
    };
  }
  return ctx;
}
