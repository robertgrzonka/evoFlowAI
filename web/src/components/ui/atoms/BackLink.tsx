'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type BackLinkProps = {
  href?: string;
  label?: string;
};

export default function BackLink({ href = '/dashboard', label = 'Back to dashboard' }: BackLinkProps) {
  return (
    <Link href={href} className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors">
      <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.9]" />
      {label}
    </Link>
  );
}
