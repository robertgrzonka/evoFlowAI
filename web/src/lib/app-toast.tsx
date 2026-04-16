'use client';

import toast from 'react-hot-toast';
import AppToastCard, { AppToastVariant } from '@/components/ui/AppToastCard';

type AppToastInput = {
  title: string;
  description?: string;
  duration?: number;
};

const showToast = (variant: AppToastVariant, { title, description, duration = 4200 }: AppToastInput) => {
  toast.custom(<AppToastCard variant={variant} title={title} description={description} />, { duration });
};

export const appToast = {
  success: (title: string, description?: string) => showToast('success', { title, description }),
  error: (title: string, description?: string) => showToast('error', { title, description, duration: 5000 }),
  info: (title: string, description?: string) => showToast('info', { title, description }),
  warning: (title: string, description?: string) => showToast('warning', { title, description }),
};
