'use client';

type EvoHintTone = 'notice' | 'warning' | 'positive';

type EvoHintCardProps = {
  title: string;
  content: string;
  tone?: EvoHintTone;
  action?: React.ReactNode;
};

const toneStyles: Record<EvoHintTone, string> = {
  notice: 'border-info-500/30 bg-info-500/8 border-l-4 border-l-info-500 shadow-sm shadow-black/5',
  warning: 'border-amber-400/35 bg-amber-400/8 border-l-4 border-l-amber-400 shadow-sm shadow-black/5',
  positive: 'border-success-500/30 bg-success-500/8 border-l-4 border-l-success-500 shadow-sm shadow-black/5',
};

export default function EvoHintCard({
  title,
  content,
  tone = 'notice',
  action,
}: EvoHintCardProps) {
  return (
    <div className={`rounded-lg border p-3.5 ${toneStyles[tone]}`}>
      <p className="text-xs uppercase tracking-[0.12em] text-text-muted mb-1">{title}</p>
      <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{content}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
