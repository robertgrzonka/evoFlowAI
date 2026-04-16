'use client';

import { useEffect } from 'react';

const isExtensionNoise = (message: string, stack: string): boolean => {
  const haystack = `${message}\n${stack}`.toLowerCase();
  return (
    haystack.includes('chrome-extension://') ||
    haystack.includes('failed to connect to metamask') ||
    haystack.includes('metamask')
  );
};

export default function BrowserExtensionErrorGuard() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = String(event.message || '');
      const stack = String(event.error instanceof Error ? event.error.stack || '' : '');
      if (!isExtensionNoise(message, stack)) {
        return;
      }
      // Ignore runtime noise from browser extensions outside the app scope.
      event.preventDefault();
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? `${reason.message || ''}\n${reason.stack || ''}`
          : typeof reason === 'string'
            ? reason
            : JSON.stringify(reason || '');

      if (!isExtensionNoise(message, '')) {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
