'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { SEND_MESSAGE_MUTATION } from '@/lib/graphql/mutations';
import AICoachAvatar from '@/components/AICoachAvatar';
import { ButtonSpinner } from '@/components/ui/loading';
import { appToast } from '@/lib/app-toast';

type ContextAICoachProps = {
  title: string;
  description: string;
  quickPrompts: string[];
  statsReference?: string;
};

type SendMessageResponse = {
  sendMessage: {
    id: string;
    content: string;
  };
};

export default function ContextAICoach({
  title,
  description,
  quickPrompts,
  statsReference,
}: ContextAICoachProps) {
  const [prompt, setPrompt] = useState('');
  const [lastAnswer, setLastAnswer] = useState('');

  const [sendMessage, { loading }] = useMutation<SendMessageResponse>(SEND_MESSAGE_MUTATION, {
    onError: (error) => {
      appToast.error('Coach unavailable', error.message || 'AI coach is temporarily unavailable.');
    },
  });

  const canSubmit = useMemo(() => prompt.trim().length > 0, [prompt]);

  const handleAskCoach = async () => {
    const content = prompt.trim();
    if (!content) return;

    const result = await sendMessage({
      variables: {
        input: {
          content,
          channel: 'COACH',
          context: statsReference ? { statsReference } : undefined,
        },
      },
    });

    const answer = result.data?.sendMessage?.content;
    if (answer) {
      setLastAnswer(answer);
      setPrompt('');
    }
  };

  return (
    <aside className="bg-surface rounded-xl border border-border p-4 md:p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AICoachAvatar size="md" />
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        </div>
      </div>

      <div className="space-y-2">
        {quickPrompts.map((quickPrompt) => (
          <button
            key={quickPrompt}
            onClick={() => setPrompt(quickPrompt)}
            className="w-full text-left bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-primary-500/30 transition-colors duration-150 ease-out"
          >
            {quickPrompt}
          </button>
        ))}
      </div>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        className="input-field w-full min-h-24 resize-y"
        placeholder="Ask AI coach about your current nutrition progress..."
      />

      <button
        onClick={handleAskCoach}
        disabled={!canSubmit || loading}
        className="btn-primary w-full inline-flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <ButtonSpinner />
            Coach is thinking...
          </>
        ) : 'Ask AI coach'}
      </button>

      {lastAnswer ? (
        <div className="bg-surface-elevated border border-border rounded-lg p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-text-muted mb-2">AI answer</p>
          <p className="text-sm text-text-primary whitespace-pre-wrap">{lastAnswer}</p>
        </div>
      ) : null}
    </aside>
  );
}
