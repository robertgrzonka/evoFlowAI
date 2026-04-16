'use client';

import { ReactNode } from 'react';
import BackLink from '@/components/ui/atoms/BackLink';

type PageTopBarProps = {
  backHref?: string;
  backLabel?: string;
  rightContent?: ReactNode;
};

export default function PageTopBar({ backHref = '/dashboard', backLabel = 'Back to dashboard', rightContent }: PageTopBarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <BackLink href={backHref} label={backLabel} />
      {rightContent ? <div className="shrink-0">{rightContent}</div> : null}
    </div>
  );
}
