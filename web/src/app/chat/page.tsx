'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
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
import { clearApolloClientCache } from '@/lib/apollo-client';
import AppShell from '@/components/AppShell';
import AICoachAvatar from '@/components/AICoachAvatar';
import ChatMarkdown from '@/components/ChatMarkdown';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import { ButtonSpinner } from '@/components/ui/loading';
import { appToast } from '@/lib/app-toast';
import { CHAT_HISTORY_LIMIT } from '@/lib/day-data';
import { formatLocalDateKey } from '@/lib/calendar-date-key';
import { useDaySnapshot } from '@/hooks/useDaySnapshot';
import { useClientCalendarToday } from '@/hooks/useClientCalendarToday';
import { buildChatStatsContext } from '@/lib/chat-stats-context';
import {
  AISectionHeader,
  EvoHintCard,
  EvoStatusBadge,
  EvoThinkingOverlay,
  InsightEmptyState,
  SmartSuggestionChips,
} from '@/components/evo';
import { graphqlAppLocaleToUi } from '@/lib/i18n/ui-locale';
import { chatPageCopy, getCoachPromptsForLocale, getGeneralPromptsForLocale } from '@/lib/i18n/copy/chat-page';
import { coachPromptModeFromPrimaryGoal } from '@evoflowai/shared';
import { accentEdgeClasses } from '@/components/ui/accent-cards';

type ChatChannel = 'GENERAL' | 'COACH';
type ChatRole = 'USER' | 'ASSISTANT';
type ChatMessage = { id: string; role: ChatRole; content: string; channel: ChatChannel };

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dateKey: today, timeZone, syncNow } = useClientCalendarToday();
  const [conversationChannel, setConversationChannel] = useState<ChatChannel>('GENERAL');
  const [prompt, setPrompt] = useState('');
  const [showCoachDebug, setShowCoachDebug] = useState(false);
  const [waitingForEvo, setWaitingForEvo] = useState(false);
  const conversationScrollRef = useRef<HTMLDivElement | null>(null);

  const { data: meData } = useQuery(ME_QUERY, { fetchPolicy: 'cache-first' });
  const locale = graphqlAppLocaleToUi(meData?.me?.preferences?.appLocale);
  const cc = chatPageCopy[locale];
  const goalMode = coachPromptModeFromPrimaryGoal(meData?.me?.preferences?.primaryGoal);
  const daySnapshot = useDaySnapshot({
    date: today,
    clientTimeZone: timeZone,
    enabled: Boolean(meData?.me?.id) && conversationChannel === 'COACH',
    includeInsight: false,
  });

  const { data, loading: historyLoading, error: historyError, refetch } = useQuery(MY_CHAT_HISTORY_QUERY, {
    variables: { channel: conversationChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 },
    fetchPolicy: 'cache-and-network',
    pollInterval: 8000,
  });
  const messages: ChatMessage[] = data?.myChatHistory || [];

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

  /** Refresh calendar key when switching channel (e.g. crossed midnight while on General). */
  useEffect(() => {
    syncNow();
  }, [conversationChannel, syncNow]);

  useEffect(() => {
    if (!historyError) return;
    appToast.error(cc.sessionExpiredTitle, cc.sessionExpiredBody);
    void (async () => {
      clearAuthToken();
      await clearApolloClientCache();
      router.push('/login');
    })();
  }, [historyError, router, cc.sessionExpiredTitle, cc.sessionExpiredBody]);

  useEffect(() => {
    if (historyLoading) return;
    const frame = requestAnimationFrame(() => {
      const container = conversationScrollRef.current;
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [conversationChannel, historyLoading, messages.length, waitingForEvo]);

  const [sendMessage, { loading: sendingMessage }] = useMutation(SEND_MESSAGE_MUTATION, {
    onCompleted: async () => {
      setPrompt('');
      await refetch({ channel: conversationChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 });
      if (conversationChannel === 'COACH') {
        await daySnapshot.refetchDay();
      }
      setWaitingForEvo(false);
    },
    onError: (error) => {
      setWaitingForEvo(false);
      appToast.error(cc.messageFailedTitle, error.message || cc.messageFailedGeneric);
    },
  });

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = prompt.trim();
    if (!content) {
      appToast.info(cc.missingMessageTitle, cc.missingMessageBody);
      return;
    }

    setWaitingForEvo(true);
    syncNow();
    await sendMessage({
      variables: {
        input: {
          content,
          channel: conversationChannel,
          context: buildChatStatsContext(),
        },
      },
      refetchQueries: [{ query: MY_CHAT_HISTORY_QUERY, variables: { channel: conversationChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 } }],
      awaitRefetchQueries: true,
    });
  };

  const quickPrompts =
    conversationChannel === 'COACH'
      ? getCoachPromptsForLocale(locale, goalMode, daySnapshot.derived.remainingProtein, daySnapshot.derived.remainingCalories)
      : getGeneralPromptsForLocale(locale);
  const suggestionChips = quickPrompts.map((label, index) => ({
    id: `${conversationChannel}-${index}`,
    label,
  }));
  const evoStatusLabel =
    conversationChannel === 'COACH'
      ? daySnapshot.loading
        ? cc.statusAnalyzing
        : daySnapshot.derived.remainingProtein > 30
          ? cc.statusProteinGap
          : daySnapshot.derived.remainingCalories < -100
            ? cc.statusCorrection
            : cc.statusCoachActive
      : cc.statusGeneralActive;

  return (
    <AppShell>
      <EvoThinkingOverlay open={waitingForEvo} locale={locale} />
      <div className="space-y-5">
        <PageTopBar rightContent={<h1 className="text-lg font-semibold tracking-tight text-text-primary">{cc.pageTitle}</h1>} />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section
            className={clsx(
              'xl:col-span-7 bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm shadow-black/5',
              accentEdgeClasses('info', 'left'),
            )}
          >
            <AISectionHeader
              eyebrow={cc.eyebrow}
              title={cc.conversationTitle}
              subtitle={conversationChannel === 'COACH' ? cc.coachSubtitle : cc.generalSubtitle}
              status={<EvoStatusBadge label={evoStatusLabel} tone={conversationChannel === 'COACH' ? 'focus' : 'neutral'} />}
            />
            <div className="mb-4 inline-flex rounded-lg border border-border bg-surface-elevated p-1 gap-1">
              <ChannelTabButton
                label={cc.tabGeneral}
                active={conversationChannel === 'GENERAL'}
                onClick={() => {
                  setConversationChannel('GENERAL');
                  router.replace('/chat?channel=GENERAL');
                }}
              />
              <ChannelTabButton
                label={cc.tabCoach}
                active={conversationChannel === 'COACH'}
                onClick={() => {
                  setConversationChannel('COACH');
                  router.replace('/chat?channel=COACH');
                }}
              />
            </div>

            {historyLoading ? (
              <ConversationSkeleton />
            ) : messages.length > 0 ? (
              <div ref={conversationScrollRef} className="max-h-[620px] overflow-y-auto pr-1 space-y-3">
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
                        <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted mb-1">{isUser ? cc.you : cc.evo}</p>
                        <ChatMarkdown content={message.content} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <InsightEmptyState
                title={conversationChannel === 'COACH' ? cc.emptyCoachTitle : cc.emptyGeneralTitle}
                description={conversationChannel === 'COACH' ? cc.emptyCoachDescription : cc.emptyGeneralDescription}
              />
            )}
          </section>

          <section
            className={clsx(
              'xl:col-span-5 bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm shadow-black/5',
              accentEdgeClasses('primary', 'left'),
            )}
          >
            <AISectionHeader
              title={conversationChannel === 'COACH' ? cc.coachModeTitle : cc.generalModeTitle}
              subtitle={
                conversationChannel === 'COACH'
                  ? cc.coachSnapshot(daySnapshot.derived.remainingCalories, daySnapshot.derived.remainingProtein)
                  : cc.generalSnapshotSubtitle
              }
              rightAction={<AICoachAvatar size="md" />}
            />

            {conversationChannel === 'COACH' ? (
              <EvoHintCard
                title={cc.quickReadTitle}
                tone="notice"
                content={
                  daySnapshot.derived.remainingProtein > 30
                    ? cc.quickReadProteinGap
                    : daySnapshot.derived.remainingCalories < -100
                      ? cc.quickReadOverBudget
                      : cc.quickReadStable
                }
              />
            ) : null}

            <form onSubmit={handleSend} className="space-y-4 mt-4">
              <SmartSuggestionChips
                title={conversationChannel === 'COACH' ? cc.chipsCoach : cc.chipsGeneral}
                suggestions={suggestionChips}
                onSelect={(value) => setPrompt(value)}
              />

              <div>
                <label htmlFor="chatPrompt" className="block text-sm font-medium text-text-primary mb-2">
                  {cc.yourMessage}
                </label>
                <textarea
                  id="chatPrompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="input-field w-full min-h-36 resize-y"
                  placeholder={
                    conversationChannel === 'COACH' ? cc.placeholderCoach : cc.placeholderGeneral
                  }
                />
              </div>

              <button type="submit" disabled={sendingMessage} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                {sendingMessage ? (
                  <>
                    <ButtonSpinner />
                    {cc.sending}
                  </>
                ) : conversationChannel === 'COACH' ? (
                  cc.askCoach
                ) : (
                  cc.askEvo
                )}
              </button>
            </form>

            {conversationChannel === 'COACH' && process.env.NODE_ENV === 'development' ? (
              <div
                className={clsx(
                  'mt-4 rounded-lg border border-border bg-surface-elevated p-3 shadow-sm shadow-black/5',
                  accentEdgeClasses('success', 'left'),
                )}
              >
                <button
                  type="button"
                  onClick={() => setShowCoachDebug((prev) => !prev)}
                  className="w-full inline-flex items-center justify-between text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span className="uppercase tracking-[0.12em]">{cc.coachDebug}</span>
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
                    <p className="pt-1 text-text-muted">{cc.sourceLine}</p>
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
                {cc.addMeal}
              </Link>
              <Link
                href="/workouts"
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-elevated px-2.5 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <Dumbbell className="h-3.5 w-3.5" />
                {cc.addWorkout}
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
