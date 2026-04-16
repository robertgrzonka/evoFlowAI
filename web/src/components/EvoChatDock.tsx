'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { ImagePlus, MessageCircle, Minus, Send, X } from 'lucide-react';
import Link from 'next/link';
import AICoachAvatar from '@/components/AICoachAvatar';
import ChatMarkdown from '@/components/ChatMarkdown';
import { ButtonSpinner } from '@/components/ui/loading';
import {
  ME_QUERY,
  MY_CHAT_HISTORY_QUERY,
  NEW_CHAT_MESSAGE_SUBSCRIPTION,
} from '@/lib/graphql/queries';
import {
  LOG_MEAL_WITH_AI_MUTATION,
  LOG_WORKOUT_MUTATION,
  SEND_MESSAGE_MUTATION,
} from '@/lib/graphql/mutations';
import { appToast } from '@/lib/app-toast';
import { buildDayRefetchQueries, CHAT_HISTORY_LIMIT } from '@/lib/day-data';
import { useDaySnapshot } from '@/hooks/useDaySnapshot';
import EvoStatusBadge from '@/components/evo/EvoStatusBadge';
import Tooltip from '@/components/ui/atoms/Tooltip';

type DockTab = 'chat' | 'meal' | 'workout';
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type WorkoutIntensity = 'LOW' | 'MEDIUM' | 'HIGH';
type ChatChannel = 'GENERAL' | 'COACH';
type ChatRole = 'USER' | 'ASSISTANT';
type ChatMessage = { id: string; role: ChatRole; content: string; channel: ChatChannel };

const mealOptions: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function EvoChatDock({ hidden = false }: { hidden?: boolean }) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DockTab>('chat');
  const [messageInput, setMessageInput] = useState('');
  const [chatChannel, setChatChannel] = useState<ChatChannel>('GENERAL');
  const [unreadCount, setUnreadCount] = useState(0);

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [mealDescription, setMealDescription] = useState('');
  const [mealImageBase64, setMealImageBase64] = useState('');
  const [mealImageMimeType, setMealImageMimeType] = useState('image/jpeg');

  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState(30);
  const [workoutCalories, setWorkoutCalories] = useState(220);
  const [workoutIntensity, setWorkoutIntensity] = useState<WorkoutIntensity>('MEDIUM');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const daySnapshot = useDaySnapshot({
    date: today,
    enabled: !hidden && chatChannel === 'COACH',
    includeInsight: true,
  });

  const { data: meData } = useQuery(ME_QUERY, { fetchPolicy: 'cache-first' });
  const { data: historyData, loading: historyLoading, refetch } = useQuery(MY_CHAT_HISTORY_QUERY, {
    variables: { channel: chatChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 },
    fetchPolicy: 'cache-and-network',
    pollInterval: 8000,
    skip: hidden,
  });
  const messages: ChatMessage[] = historyData?.myChatHistory || [];

  useSubscription(NEW_CHAT_MESSAGE_SUBSCRIPTION, {
    variables: { userId: meData?.me?.id, channel: chatChannel },
    skip: !meData?.me?.id || hidden,
    onData: () => {
      refetch({ channel: chatChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 });
      if (!isOpen) setUnreadCount((prev) => prev + 1);
    },
  });

  const [sendMessage, { loading: sendingMessage }] = useMutation(SEND_MESSAGE_MUTATION, {
    onError: (error) => {
      appToast.error('Message failed', error.message || 'Could not send message.');
    },
    onCompleted: async () => {
      setMessageInput('');
      await refetch({ channel: chatChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 });
    },
    awaitRefetchQueries: true,
  });

  const [logMealWithAI, { loading: loggingMeal }] = useMutation(LOG_MEAL_WITH_AI_MUTATION, {
    onError: (error) => {
      appToast.error('Meal save failed', error.message || 'Could not add meal.');
    },
    onCompleted: async () => {
      setMealDescription('');
      setMealImageBase64('');
      setMealImageMimeType('image/jpeg');
      setActiveTab('chat');
      appToast.success('Meal added', 'Evo logged your meal to today.');
      await refetch({ channel: chatChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 });
    },
    refetchQueries: buildDayRefetchQueries(today),
    awaitRefetchQueries: true,
  });

  const [logWorkout, { loading: loggingWorkout }] = useMutation(LOG_WORKOUT_MUTATION, {
    onError: (error) => {
      appToast.error('Workout save failed', error.message || 'Could not add workout.');
    },
    onCompleted: async () => {
      setWorkoutTitle('');
      setActiveTab('chat');
      appToast.success('Workout added', 'Evo logged your training session.');
      await refetch({ channel: chatChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 });
    },
    refetchQueries: buildDayRefetchQueries(today),
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'chat') return;
    const frame = requestAnimationFrame(() => {
      const container = chatScrollRef.current;
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, activeTab, chatChannel, historyLoading, messages.length]);

  if (hidden) return null;
  const insightSignalsCount =
    (daySnapshot.derived.remainingProtein > 30 ? 1 : 0) +
    (daySnapshot.derived.remainingCalories < -100 ? 1 : 0) +
    (daySnapshot.insight ? 1 : 0);
  const launcherHint =
    insightSignalsCount > 0
      ? `I have ${insightSignalsCount} insight${insightSignalsCount > 1 ? 's' : ''} for today.`
      : 'All calm. I can still help optimize your day.';

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = messageInput.trim();
    if (!content) return;

    await sendMessage({
      variables: {
        input: {
          content,
          channel: chatChannel,
          context: chatChannel === 'COACH' ? { statsReference: today } : undefined,
        },
      },
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      appToast.info('Invalid file', 'Please upload an image.');
      return;
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const [meta, payload] = base64.split(',');
    if (!payload) {
      appToast.error('Image read failed', 'Could not read image.');
      return;
    }
    const mime = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    setMealImageBase64(payload);
    setMealImageMimeType(mime);
  };

  const handleMealSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mealDescription.trim() && !mealImageBase64) {
      appToast.info('Missing meal input', 'Add meal description or image.');
      return;
    }

    await logMealWithAI({
      variables: {
        input: {
          content: mealDescription.trim() || null,
          imageBase64: mealImageBase64 || null,
          imageMimeType: mealImageBase64 ? mealImageMimeType : null,
          mealType,
        },
      },
    });
    await refetch({ channel: chatChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 });
  };

  const handleWorkoutSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workoutTitle.trim()) {
      appToast.info('Missing workout title', 'Add workout title before saving.');
      return;
    }

    await logWorkout({
      variables: {
        input: {
          title: workoutTitle.trim(),
          durationMinutes: Number(workoutDuration),
          caloriesBurned: Number(workoutCalories),
          intensity: workoutIntensity,
          performedAt: new Date().toISOString(),
        },
      },
    });
    await refetch({ channel: chatChannel, limit: CHAT_HISTORY_LIMIT, offset: 0 });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-[360px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <AICoachAvatar size="sm" />
              <div>
                <p className="text-sm font-semibold text-text-primary leading-none">Evo Chat</p>
                <p className="text-[11px] text-text-muted mt-1">Live coach for goals, meals and workouts</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:text-text-primary"
                title="Minimize"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveTab('chat');
                  setChatChannel('GENERAL');
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:text-text-primary"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-border flex gap-1">
            <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} label="Chat" />
            <TabButton active={activeTab === 'meal'} onClick={() => setActiveTab('meal')} label="Add meal" />
            <TabButton active={activeTab === 'workout'} onClick={() => setActiveTab('workout')} label="Add workout" />
          </div>

          {activeTab === 'chat' ? (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <EvoStatusBadge
                  label={
                    chatChannel === 'COACH'
                      ? daySnapshot.loading
                        ? 'analyzing'
                        : 'coach mode'
                      : 'general mode'
                  }
                  tone={chatChannel === 'COACH' ? 'focus' : 'neutral'}
                />
                {chatChannel === 'COACH' ? (
                  <span className="text-[11px] text-text-muted">
                    {Math.round(daySnapshot.derived.remainingProtein)}g protein left
                  </span>
                ) : null}
              </div>
              <div className="inline-flex rounded-lg border border-border bg-surface-elevated p-1 gap-1">
                <TabButton active={chatChannel === 'GENERAL'} onClick={() => setChatChannel('GENERAL')} label="General" />
                <TabButton active={chatChannel === 'COACH'} onClick={() => setChatChannel('COACH')} label="Coach" />
              </div>
              <div ref={chatScrollRef} className="h-72 overflow-y-auto space-y-2 pr-1">
                {historyLoading ? (
                  <p className="text-sm text-text-secondary">Loading conversation...</p>
                ) : messages.length > 0 ? (
                  messages.map((message) => {
                    const isUser = message.role === 'USER';
                    return (
                      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[86%] rounded-2xl border px-3 py-2 ${
                            isUser ? 'bg-info-500/15 border-info-500/30 rounded-br-md' : 'bg-success-500/10 border-success-500/30 rounded-bl-md'
                          }`}
                        >
                          <p className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-1">{isUser ? 'You' : 'Evo'}</p>
                          <ChatMarkdown content={message.content} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-text-secondary">Start chatting with Evo.</p>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  className="input-field w-full"
                  placeholder={chatChannel === 'COACH' ? 'Ask Evo about today goals...' : 'Ask Evo anything...'}
                />
                <button type="submit" disabled={sendingMessage} className="btn-primary inline-flex h-10 w-10 items-center justify-center px-0">
                  {sendingMessage ? <ButtonSpinner /> : <Send className="h-4 w-4" />}
                </button>
              </form>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href={`/chat?channel=${chatChannel}`}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center rounded-md border border-primary-500/30 bg-primary-500/10 px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-primary-500/15 transition-colors"
                >
                  Open full chat
                </Link>
                <Link
                  href="/meals"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center rounded-md border border-border bg-surface-elevated px-2.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Open meal log view
                </Link>
              </div>
            </div>
          ) : null}

          {activeTab === 'meal' ? (
            <form onSubmit={handleMealSubmit} className="p-3 space-y-3">
              <select value={mealType} onChange={(event) => setMealType(event.target.value as MealType)} className="input-field w-full">
                {mealOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
              <textarea
                value={mealDescription}
                onChange={(event) => setMealDescription(event.target.value)}
                className="input-field w-full min-h-24 resize-y"
                placeholder="Describe your meal..."
              />
              <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary cursor-pointer">
                <ImagePlus className="h-4 w-4" />
                Upload image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              <button type="submit" disabled={loggingMeal} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                {loggingMeal ? (
                  <>
                    <ButtonSpinner />
                    Adding meal...
                  </>
                ) : (
                  'Add meal with Evo'
                )}
              </button>
            </form>
          ) : null}

          {activeTab === 'workout' ? (
            <form onSubmit={handleWorkoutSubmit} className="p-3 space-y-3">
              <input
                value={workoutTitle}
                onChange={(event) => setWorkoutTitle(event.target.value)}
                className="input-field w-full"
                placeholder="Workout title"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  value={workoutDuration}
                  onChange={(event) => setWorkoutDuration(Number(event.target.value))}
                  className="input-field w-full"
                  placeholder="minutes"
                />
                <input
                  type="number"
                  min={0}
                  value={workoutCalories}
                  onChange={(event) => setWorkoutCalories(Number(event.target.value))}
                  className="input-field w-full"
                  placeholder="kcal burned"
                />
              </div>
              <select
                value={workoutIntensity}
                onChange={(event) => setWorkoutIntensity(event.target.value as WorkoutIntensity)}
                className="input-field w-full"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <button type="submit" disabled={loggingWorkout} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                {loggingWorkout ? (
                  <>
                    <ButtonSpinner />
                    Adding workout...
                  </>
                ) : (
                  'Add workout with Evo'
                )}
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        <Tooltip content={launcherHint}>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-full border border-primary-500/35 bg-surface px-3 py-2 text-sm text-text-primary shadow-lg hover:bg-surface-elevated"
          >
            <AICoachAvatar size="sm" />
            <span className="pr-1">Evo</span>
            <MessageCircle className="h-4 w-4 text-primary-400" />
            {insightSignalsCount > 0 ? (
              <span className="absolute -bottom-1 left-7 rounded-full border border-primary-500/45 bg-primary-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-primary-200">
                {insightSignalsCount} insight{insightSignalsCount > 1 ? 's' : ''}
              </span>
            ) : null}
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary-500 text-white text-[11px] inline-flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>
        </Tooltip>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${
        active
          ? 'bg-primary-500/15 border border-primary-500/30 text-text-primary'
          : 'text-text-secondary border border-transparent hover:text-text-primary hover:bg-surface-elevated'
      }`}
    >
      {label}
    </button>
  );
}
