'use client';

import EvoGhostMark from '@/components/EvoGhostMark';

type AICoachAvatarProps = {
  size?: 'sm' | 'md';
};

export default function AICoachAvatar({ size = 'md' }: AICoachAvatarProps) {
  const isSmall = size === 'sm';
  const ghostSizeClass = isSmall ? 'h-5 w-5' : 'h-7 w-7';

  return (
    <div
      className={`ai-avatar ${isSmall ? 'h-7 w-7' : 'h-10 w-10'} rounded-full relative shrink-0 flex items-center justify-center`}
      aria-hidden="true"
    >
      <EvoGhostMark className={`${ghostSizeClass} drop-shadow-[0_0_6px_rgba(255,78,138,0.55)]`} />
    </div>
  );
}
