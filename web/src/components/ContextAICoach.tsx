'use client';

import { clsx } from 'clsx';
import { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { SEND_MESSAGE_MUTATION } from '@/lib/graphql/mutations';
import { buildChatStatsContext } from '@/lib/chat-stats-context';
import AICoachAvatar from '@/components/AICoachAvatar';
import { ButtonSpinner } from '@/components/ui/loading';
import { appToast } from '@/lib/app-toast';
import ChatMarkdown from '@/components/ChatMarkdown';
import { SmartSuggestionChips } from '@/components/evo';
import { accentEdgeClasses } from '@/components/ui/accent-cards';

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
          context: buildChatStatsContext(statsReference),
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
    <aside
      className={clsx(
        'bg-surface rounded-xl border border-border p-4 md:p-5 space-y-4 shadow-sm shadow-black/5',
        accentEdgeClasses('primary', 'left'),
      )}
    >
      <div className="flex items-start gap-3">
        <AICoachAvatar size="md" />
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <SmartSuggestionChips
          title="Smart prompts"
          suggestions={quickPrompts.map((quickPrompt, index) => ({ id: `ctx-${index}`, label: quickPrompt }))}
          onSelect={(value) => setPrompt(value)}
        />
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
          <p className="text-xs uppercase tracking-[0.14em] text-text-muted mb-2">Evo answer</p>
          <ChatMarkdown content={lastAnswer} />
        </div>
      ) : null}
    </aside>
  );
}
