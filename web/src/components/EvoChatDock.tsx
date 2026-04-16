'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { ImagePlus, MessageCircle, Minus, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AICoachAvatar from '@/components/AICoachAvatar';
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

type DockTab = 'chat' | 'meal' | 'workout';
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type WorkoutIntensity = 'LOW' | 'MEDIUM' | 'HIGH';

const mealOptions: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function EvoChatDock({ hidden = false }: { hidden?: boolean }) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DockTab>('chat');
  const [messageInput, setMessageInput] = useState('');
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

  const { data: meData } = useQuery(ME_QUERY, { fetchPolicy: 'cache-first' });
  const { data: historyData, loading: historyLoading, refetch } = useQuery(MY_CHAT_HISTORY_QUERY, {
    variables: { limit: 20, offset: 0 },
    fetchPolicy: 'cache-and-network',
    pollInterval: 8000,
    skip: hidden,
  });
  const messages = historyData?.myChatHistory || [];

  useSubscription(NEW_CHAT_MESSAGE_SUBSCRIPTION, {
    variables: { userId: meData?.me?.id },
    skip: !meData?.me?.id || hidden,
    onData: () => {
      refetch({ limit: 20, offset: 0 });
      if (!isOpen) setUnreadCount((prev) => prev + 1);
    },
  });

  const [sendMessage, { loading: sendingMessage }] = useMutation(SEND_MESSAGE_MUTATION, {
    onError: (error) => {
      toast.error(error.message || 'Could not send message');
    },
    onCompleted: () => {
      setMessageInput('');
      refetch({ limit: 20, offset: 0 });
    },
  });

  const [logMealWithAI, { loading: loggingMeal }] = useMutation(LOG_MEAL_WITH_AI_MUTATION, {
    onError: (error) => {
      toast.error(error.message || 'Could not add meal');
    },
    onCompleted: () => {
      setMealDescription('');
      setMealImageBase64('');
      setMealImageMimeType('image/jpeg');
      setActiveTab('chat');
      toast.success('Meal added via Evo');
      refetch({ limit: 20, offset: 0 });
    },
  });

  const [logWorkout, { loading: loggingWorkout }] = useMutation(LOG_WORKOUT_MUTATION, {
    onError: (error) => {
      toast.error(error.message || 'Could not add workout');
    },
    onCompleted: () => {
      setWorkoutTitle('');
      setActiveTab('chat');
      toast.success('Workout added via Evo');
    },
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
  }, [isOpen, activeTab, messages.length]);

  if (hidden) return null;

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = messageInput.trim();
    if (!content) return;

    await sendMessage({
      variables: {
        input: {
          content,
          context: {
            statsReference: today,
          },
        },
      },
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image');
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
      toast.error('Could not read image');
      return;
    }
    const mime = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    setMealImageBase64(payload);
    setMealImageMimeType(mime);
  };

  const handleMealSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mealDescription.trim() && !mealImageBase64) {
      toast.error('Add meal description or image');
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
  };

  const handleWorkoutSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workoutTitle.trim()) {
      toast.error('Add workout title');
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
                onClick={() => setIsOpen(false)}
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
              <div ref={chatScrollRef} className="h-72 overflow-y-auto space-y-2 pr-1">
                {historyLoading ? (
                  <p className="text-sm text-text-secondary">Loading conversation...</p>
                ) : messages.length > 0 ? (
                  messages.map((message: any) => {
                    const isUser = message.role === 'USER';
                    return (
                      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[86%] rounded-2xl border px-3 py-2 ${
                            isUser ? 'bg-info-500/15 border-info-500/30 rounded-br-md' : 'bg-success-500/10 border-success-500/30 rounded-bl-md'
                          }`}
                        >
                          <p className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-1">{isUser ? 'You' : 'Evo'}</p>
                          <p className="text-sm text-text-primary whitespace-pre-wrap">{message.content}</p>
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
                  placeholder="Ask Evo about your day..."
                />
                <button type="submit" disabled={sendingMessage} className="btn-primary inline-flex h-10 w-10 items-center justify-center px-0">
                  {sendingMessage ? <ButtonSpinner /> : <Send className="h-4 w-4" />}
                </button>
              </form>
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
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative inline-flex items-center gap-2 rounded-full border border-primary-500/35 bg-surface px-3 py-2 text-sm text-text-primary shadow-lg hover:bg-surface-elevated"
        >
          <AICoachAvatar size="sm" />
          <span className="pr-1">Evo</span>
          <MessageCircle className="h-4 w-4 text-primary-400" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary-500 text-white text-[11px] inline-flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
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
