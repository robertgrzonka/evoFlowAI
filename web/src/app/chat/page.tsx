'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { ChevronDown, ChevronUp, Dumbbell, Utensils } from 'lucide-react';
import { SEND_MESSAGE_MUTATION } from '@/lib/graphql/mutations';
import {
  ME_QUERY,
  MY_CHAT_HISTORY_QUERY,
  NEW_CHAT_MESSAGE_SUBSCRIPTION,
} from '@/lib/graphql/queries';
import { clearAuthToken } from '@/lib/auth-token';
import AppShell from '@/components/AppShell';
import AICoachAvatar from '@/components/AICoachAvatar';
import ChatMarkdown from '@/components/ChatMarkdown';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import { ButtonSpinner } from '@/components/ui/loading';
import { appToast } from '@/lib/app-toast';
import { CHAT_HISTORY_LIMIT } from '@/lib/day-data';
import { useDaySnapshot } from '@/hooks/useDaySnapshot';

type ChatChannel = 'GENERAL' | 'COACH';
type ChatRole = 'USER' | 'ASSISTANT';
type ChatMessage = { id: string; role: ChatRole; content: string; channel: ChatChannel };

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [conversationChannel, setConversationChannel] = useState<ChatChannel>('GENERAL');
  const [prompt, setPrompt] = useState('');
  const [showCoachDebug, setShowCoachDebug] = useState(false);

  const { data: meData } = useQuery(ME_QUERY, { fetchPolicy: 'cache-first' });
  const goalMode = String(meData?.me?.preferences?.primaryGoal || 'MAINTENANCE').toUpperCase();
  const daySnapshot = useDaySnapshot({
    date: today,
    enabled: Boolean(meData?.me?.id) && conversationChannel === 'COACH',
    includeInsight: false,
  });

  const { data, loading: historyLoading, error: historyError, refetch } = useQuery(MY_CHAT_HISTORY_QUERY, {
    variables: { channel: conversationChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 },
    fetchPolicy: 'cache-and-network',
    pollInterval: 8000,
  });

  useSubscription(NEW_CHAT_MESSAGE_SUBSCRIPTION, {
    variables: { userId: meData?.me?.id, channel: conversationChannel },
    skip: !meData?.me?.id,
    onData: () => {
      refetch({ channel: conversationChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 });
    },
  });

  useEffect(() => {
    const channelParam = String(searchParams.get('channel') || '').toUpperCase();
    if (channelParam === 'COACH') {
      setConversationChannel('COACH');
    } else if (channelParam === 'GENERAL') {
      setConversationChannel('GENERAL');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!historyError) return;
    appToast.error('Session expired', 'Please log in again.');
    clearAuthToken();
    router.push('/login');
  }, [historyError, router]);

  const [sendMessage, { loading: sendingMessage }] = useMutation(SEND_MESSAGE_MUTATION, {
    onCompleted: async () => {
      setPrompt('');
      await refetch({ channel: conversationChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 });
      if (conversationChannel === 'COACH') {
        await daySnapshot.refetchDay();
      }
    },
    onError: (error) => {
      appToast.error('Message failed', error.message || 'Could not send message.');
    },
  });

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = prompt.trim();
    if (!content) {
      appToast.info('Missing message', 'Write a message for Evo.');
      return;
    }

    await sendMessage({
      variables: {
        input: {
          content,
          channel: conversationChannel,
          context: conversationChannel === 'COACH' ? { statsReference: today } : undefined,
        },
      },
      refetchQueries: [{ query: MY_CHAT_HISTORY_QUERY, variables: { channel: conversationChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 } }],
      awaitRefetchQueries: true,
    });
  };

  const messages: ChatMessage[] = data?.myChatHistory || [];
  const quickPrompts = conversationChannel === 'COACH' ? getCoachPrompts(goalMode) : getGeneralPrompts();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageTopBar rightContent={<h1 className="text-lg font-semibold tracking-tight text-text-primary">Evo Chat</h1>} />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-7 bg-surface border border-border rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold tracking-tight text-text-primary">Conversation</h2>
              <span className="text-xs text-text-muted">Latest at bottom</span>
            </div>
            <div className="mb-4 inline-flex rounded-lg border border-border bg-surface-elevated p-1 gap-1">
              <ChannelTabButton label="General" active={conversationChannel === 'GENERAL'} onClick={() => setConversationChannel('GENERAL')} />
              <ChannelTabButton label="Coach" active={conversationChannel === 'COACH'} onClick={() => setConversationChannel('COACH')} />
            </div>

            {historyLoading ? (
              <ConversationSkeleton />
            ) : messages.length > 0 ? (
              <div className="max-h-[620px] overflow-y-auto pr-1 space-y-3">
                {messages.map((message) => {
                  const isUser = message.role === 'USER';
                  return (
                    <div key={message.id} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser ? <AICoachAvatar size="sm" /> : null}
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 border ${
                          isUser
                            ? 'bg-info-500/15 border-info-500/35 rounded-br-md'
                            : 'bg-success-500/10 border-success-500/30 rounded-bl-md'
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted mb-1">{isUser ? 'You' : 'Evo'}</p>
                        <ChatMarkdown content={message.content} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-surface-elevated p-4">
                <p className="text-text-secondary text-sm">
                  {conversationChannel === 'COACH'
                    ? 'No coach messages yet. Ask Evo about your current day stats and next action.'
                    : 'No general chat messages yet. Start a conversation with Evo.'}
                </p>
              </div>
            )}
          </section>

          <section className="xl:col-span-5 bg-surface border border-border rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-3 mb-4">
              <AICoachAvatar size="md" />
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-text-primary">
                  {conversationChannel === 'COACH' ? 'Ask Nutrition Coach' : 'Ask General Evo'}
                </h2>
                <p className="text-xs text-text-muted">
                  {conversationChannel === 'COACH'
                    ? 'Context-aware answers based on your daily intake, training and goals'
                    : 'General conversation, planning, and practical lifestyle support'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-text-muted">
                  {conversationChannel === 'COACH' ? 'Coach shortcuts' : 'General shortcuts'}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {quickPrompts.map((quickPrompt) => (
                    <button
                      key={quickPrompt}
                      type="button"
                      onClick={() => setPrompt(quickPrompt)}
                      className="text-left rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-primary-500/30 transition-colors"
                    >
                      {quickPrompt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="chatPrompt" className="block text-sm font-medium text-text-primary mb-2">
                  Your message
                </label>
                <textarea
                  id="chatPrompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="input-field w-full min-h-36 resize-y"
                  placeholder={
                    conversationChannel === 'COACH'
                      ? 'Example: I have around 700 kcal left and low protein. What should I eat for dinner?'
                      : 'Example: Help me build a realistic weekly routine for meals and workouts.'
                  }
                />
              </div>

              <button type="submit" disabled={sendingMessage} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                {sendingMessage ? (
                  <>
                    <ButtonSpinner />
                    Sending...
                  </>
                ) : conversationChannel === 'COACH' ? (
                  'Ask Evo coach'
                ) : (
                  'Ask Evo'
                )}
              </button>
            </form>

            {conversationChannel === 'COACH' ? (
              <div className="mt-4 rounded-lg border border-border bg-surface-elevated p-3">
                <button
                  type="button"
                  onClick={() => setShowCoachDebug((prev) => !prev)}
                  className="w-full inline-flex items-center justify-between text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span className="uppercase tracking-[0.12em]">Coach debug snapshot</span>
                  {showCoachDebug ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {showCoachDebug ? (
                  <div className="mt-3 rounded-md border border-border bg-background/40 p-2.5 font-mono text-[11px] text-text-secondary space-y-1">
                    <p>date: {today}</p>
                    <p>budget_dynamic_kcal: {Math.round(daySnapshot.derived.calorieBudget || 0)}</p>
                    <p>consumed_kcal: {Math.round(daySnapshot.derived.consumedCalories || 0)}</p>
                    <p>burned_training_kcal: {Math.round(daySnapshot.derived.caloriesBurned || 0)}</p>
                    <p>remaining_kcal: {Math.round(daySnapshot.derived.remainingCalories || 0)}</p>
                    <p>net_kcal: {Math.round(daySnapshot.derived.netCalories || 0)}</p>
                    <p>protein_consumed_g: {Math.round(daySnapshot.derived.consumedProtein || 0)}</p>
                    <p>protein_target_g: {Math.round(daySnapshot.derived.proteinGoal || 0)}</p>
                    <p>protein_remaining_g: {Math.round(daySnapshot.derived.remainingProtein || 0)}</p>
                    <p>carbs_consumed_g: {Math.round(daySnapshot.derived.carbsConsumed || 0)}</p>
                    <p>fat_consumed_g: {Math.round(daySnapshot.derived.fatConsumed || 0)}</p>
                    <p>steps_tracked: {Math.round(daySnapshot.derived.steps || 0)}</p>
                    <p className="pt-1 text-text-muted">
                      source: shared day snapshot
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/meals"
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-elevated px-2.5 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <Utensils className="h-3.5 w-3.5" />
                Add meal
              </Link>
              <Link
                href="/workouts"
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-elevated px-2.5 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <Dumbbell className="h-3.5 w-3.5" />
                Add workout
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function ChannelTabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${
        active
          ? 'bg-primary-500/15 border border-primary-500/30 text-text-primary'
          : 'text-text-secondary border border-transparent hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex justify-end">
        <div className="w-[70%] h-20 rounded-2xl bg-surface-elevated border border-border" />
      </div>
      <div className="flex justify-start">
        <div className="h-7 w-7 rounded-full bg-surface-elevated border border-border" />
        <div className="w-[82%] h-24 rounded-2xl bg-surface-elevated border border-border ml-2" />
      </div>
      <div className="flex justify-end">
        <div className="w-[62%] h-16 rounded-2xl bg-surface-elevated border border-border" />
      </div>
    </div>
  );
}

function getCoachPrompts(goalMode: string) {
  if (goalMode === 'FAT_LOSS') {
    return [
      'Review my day and suggest one low-calorie high-protein next meal.',
      'What is most off target in my macros right now?',
      'Give me a practical plan for the rest of today.',
    ];
  }

  if (goalMode === 'MUSCLE_GAIN') {
    return [
      'How should I finish today to support lean muscle gain?',
      'Suggest a high-protein and high-carb dinner idea.',
      'What should I prioritize after training today?',
    ];
  }

  return [
    'Review my current day and suggest one balanced next step.',
    'What should I improve first: calories, protein, or meal timing?',
    'Give me one nutrition tweak and one recovery tweak for tonight.',
  ];
}

function getGeneralPrompts() {
  return [
    'Help me plan a realistic weekly routine for food and training.',
    'I have a busy week. How can I stay consistent without overcomplicating?',
    'Create a simple framework to improve my results in the next 14 days.',
  ];
}
