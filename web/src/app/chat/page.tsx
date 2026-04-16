'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { LOG_MEAL_WITH_AI_MUTATION } from '@/lib/graphql/mutations';
import { DAILY_STATS_QUERY, ME_QUERY, MY_CHAT_HISTORY_QUERY, NEW_CHAT_MESSAGE_SUBSCRIPTION } from '@/lib/graphql/queries';
import { clearAuthToken } from '@/lib/auth-token';
import AppShell from '@/components/AppShell';
import AICoachAvatar from '@/components/AICoachAvatar';
import { ButtonSpinner } from '@/components/ui/loading';
import { appToast } from '@/lib/app-toast';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const mealOptions: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function ChatPage() {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [content, setContent] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [readingImage, setReadingImage] = useState(false);
  const { data: meData } = useQuery(ME_QUERY, { fetchPolicy: 'cache-first' });
  const goalMode = String(meData?.me?.preferences?.primaryGoal || 'MAINTENANCE').toUpperCase();

  const { data, loading: historyLoading, error: historyError, refetch } = useQuery(MY_CHAT_HISTORY_QUERY, {
    variables: { limit: 30, offset: 0 },
    fetchPolicy: 'cache-and-network',
    pollInterval: 5000,
  });

  useSubscription(NEW_CHAT_MESSAGE_SUBSCRIPTION, {
    variables: { userId: meData?.me?.id },
    skip: !meData?.me?.id,
    onData: () => {
      refetch({ limit: 30, offset: 0 });
    },
  });

  useEffect(() => {
    if (!historyError) return;

    appToast.error('Session expired', 'Please log in again.');
    clearAuthToken();
    router.push('/login');
  }, [historyError, router]);

  const [logMealWithAI, { loading: sending }] = useMutation(LOG_MEAL_WITH_AI_MUTATION, {
    onCompleted: () => {
      setContent('');
      setImageBase64('');
      setImagePreview(null);
      appToast.success('Meal saved', 'Evo analyzed your meal and updated your diary.');
    },
    onError: (error) => {
      appToast.error('Analysis failed', error.message || 'Unable to analyze meal.');
    },
    refetchQueries: [
      { query: DAILY_STATS_QUERY, variables: { date: today } },
      { query: MY_CHAT_HISTORY_QUERY, variables: { limit: 30, offset: 0 } },
    ],
  });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      appToast.info('Invalid file', 'Please select an image file.');
      return;
    }

    try {
      setReadingImage(true);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const [meta, payload] = base64.split(',');
      if (!payload) {
        appToast.error('Image read failed', 'Failed to read image.');
        return;
      }

      const mime = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
      setImageBase64(payload);
      setImageMimeType(mime);
      setImagePreview(base64);
    } finally {
      setReadingImage(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!content.trim() && !imageBase64) {
      appToast.info('Missing meal input', 'Add a meal description or upload an image.');
      return;
    }

    await logMealWithAI({
      variables: {
        input: {
          content: content.trim() || null,
          imageBase64: imageBase64 || null,
          imageMimeType: imageBase64 ? imageMimeType : null,
          mealType,
        },
      },
    });
  };

  const messages = [...(data?.myChatHistory || [])].reverse();
  const quickPrompts = getQuickPrompts(goalMode);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.9]" />
            Back to dashboard
          </Link>
          <h1 className="text-lg font-semibold tracking-tight text-text-primary">AI Meal Chat</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-7 bg-surface border border-border rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold tracking-tight text-text-primary">Conversation</h2>
              <span className="text-xs text-text-muted">Newest first</span>
            </div>

            {historyLoading ? (
              <ConversationSkeleton />
            ) : messages.length > 0 ? (
              <div className="max-h-[620px] overflow-y-auto pr-1 space-y-3">
                {messages.map((message: any) => {
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
                        <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted mb-1">
                          {isUser ? 'You' : 'Evo'}
                        </p>
                        <p className="text-sm text-text-primary whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-surface-elevated p-4">
                <p className="text-text-secondary text-sm">
                  No messages yet. Send meal description or image from the right panel.
                </p>
              </div>
            )}
          </section>

          <section className="xl:col-span-5 bg-surface border border-border rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-3 mb-4">
              <AICoachAvatar size="md" />
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-text-primary">Analyze Meal</h2>
                <p className="text-xs text-text-muted">Evo will estimate calories and macros</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="mealType" className="block text-sm font-medium text-text-primary mb-2">
                  Meal type
                </label>
                <select
                  id="mealType"
                  value={mealType}
                  onChange={(event) => setMealType(event.target.value as MealType)}
                  className="input-field w-full"
                >
                  {mealOptions.map((item) => (
                    <option key={item} value={item}>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-text-primary mb-2">
                  Meal description
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Example: grilled chicken with rice and salad, around 350g total"
                  className="input-field w-full min-h-28 resize-y"
                />
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-text-muted">Coach shortcuts</p>
                <div className="grid grid-cols-1 gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setContent(prompt)}
                      className="text-left rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-primary-500/30 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="imageUpload" className="block text-sm font-medium text-text-primary mb-2">
                  Upload meal image
                </label>
                <label className="w-full border border-dashed border-border rounded-lg p-3.5 flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors duration-150 ease-out">
                  <ImagePlus className="h-4 w-4 stroke-[1.9]" />
                  <span>Choose image</span>
                  <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>

                {readingImage ? (
                  <div className="mt-3 h-36 w-full rounded-lg border border-border bg-surface-elevated animate-pulse" />
                ) : imagePreview ? (
                  <img src={imagePreview} alt="Meal preview" className="mt-3 h-36 w-full object-cover rounded-lg border border-border" />
                ) : (
                  <div className="mt-3 h-20 w-full rounded-lg border border-border bg-surface-elevated flex items-center justify-center text-xs text-text-muted">
                    Image preview appears here
                  </div>
                )}
              </div>

              <button type="submit" disabled={sending} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                {sending ? (
                  <>
                    <ButtonSpinner />
                    Analyzing and saving...
                  </>
                ) : (
                  'Analyze meal and save to diary'
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
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

function getQuickPrompts(goalMode: string) {
  if (goalMode === 'FAT_LOSS') {
    return [
      'I need a low-calorie high-protein dinner idea for tonight.',
      'Based on today, what should I avoid eating late evening?',
      'How can I keep deficit but not feel hungry after training?',
    ];
  }

  if (goalMode === 'MUSCLE_GAIN') {
    return [
      'Suggest a calorie-dense but clean post-workout meal.',
      'How much protein should I still eat this evening?',
      'Give me one snack idea to support lean bulk.',
    ];
  }

  if (goalMode === 'STRENGTH') {
    return [
      'What should I eat before heavy lifting for better performance?',
      'Give me a recovery meal with enough carbs and protein.',
      'How do I fuel on hard training days vs rest days?',
    ];
  }

  return [
    'Review my day and suggest one balanced next meal.',
    'What macro is most off target right now?',
    'Give me one simple nutrition tweak for tomorrow.',
  ];
}
