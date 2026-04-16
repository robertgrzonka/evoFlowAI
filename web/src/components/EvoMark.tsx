'use client';

type EvoMarkProps = {
  className?: string;
};

export default function EvoMark({ className = 'h-5 w-5' }: EvoMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12.7 2.8c-2.8 2.3-4.2 5.1-4.2 8.2 0 3.2 1.8 5.7 4.6 6.7-3.7.1-7.1-2.5-7.1-6.7 0-2.8 1.3-5.5 3.8-7.7 1-.9 2.1-1.8 2.9-2.7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.1 7.2c2 1.8 3.6 3.6 3.6 6.1 0 3.3-2.7 5.9-6 5.9 3.1-.8 5.2-3.1 5.2-6 0-1.9-1-3.7-2.8-5.2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15.7" cy="8.4" r="1.6" fill="white" />
    </svg>
  );
}
