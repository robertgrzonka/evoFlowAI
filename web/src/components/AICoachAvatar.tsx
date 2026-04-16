'use client';

import EvoMark from '@/components/EvoMark';

type AICoachAvatarProps = {
  size?: 'sm' | 'md';
};

export default function AICoachAvatar({ size = 'md' }: AICoachAvatarProps) {
  const isSmall = size === 'sm';

  return (
    <div
      className={`ai-avatar ${isSmall ? 'h-7 w-7' : 'h-10 w-10'} rounded-full relative shrink-0 flex items-center justify-center`}
      aria-hidden="true"
    >
      <EvoMark className={`${isSmall ? 'h-4 w-4' : 'h-5 w-5'} text-primary-500`} />
    </div>
  );
}
