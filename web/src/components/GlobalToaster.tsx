'use client';

import { ToastBar, Toaster } from 'react-hot-toast';
import EvoMark from '@/components/EvoMark';

export default function GlobalToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      containerStyle={{ top: 16, right: 16 }}
      toastOptions={{
        duration: 4200,
      }}
    >
      {(toast) => {
        if (toast.type === 'custom') {
          return (
            <ToastBar
              toast={toast}
              style={{
                background: 'transparent',
                boxShadow: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              {({ message }) => <>{message}</>}
            </ToastBar>
          );
        }

        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';
        const borderTone = isError
          ? 'border-red-400/45'
          : isSuccess
            ? 'border-success-500/40'
            : 'border-primary-500/35';
        const iconTone = isError
          ? 'text-red-300'
          : isSuccess
            ? 'text-success-400'
            : 'text-primary-400';

        return (
          <ToastBar
            toast={toast}
            style={{
              background: 'transparent',
              boxShadow: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            {({ message }) => (
              <div
                className={`max-w-[360px] rounded-lg border ${borderTone} bg-surface/95 backdrop-blur px-3 py-2.5 shadow-lg shadow-black/25 flex items-start gap-2.5`}
              >
                <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center ${iconTone}`}>
                  {isError ? (
                    <span className="text-sm leading-none">!</span>
                  ) : (
                    <EvoMark className="h-4 w-4" />
                  )}
                </span>
                <p className="text-sm text-text-primary leading-snug">{message}</p>
              </div>
            )}
          </ToastBar>
        );
      }}
    </Toaster>
  );
}
