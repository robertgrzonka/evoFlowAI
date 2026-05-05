import crypto from 'crypto';
import { UserDocument } from '../models/User';
import { OpenAIService, OpenAIServiceRuntime } from './openaiService';

export type AIAccessTier = 'free' | 'platform_premium' | 'byok';
export type AIApiKeySource = 'platform' | 'user';

export type AIAccessRuntime = OpenAIServiceRuntime & {
  tier: AIAccessTier;
  apiKeySource: AIApiKeySource;
  fallback?: OpenAIServiceRuntime & {
    tier: AIAccessTier;
    apiKeySource: 'platform';
  };
};

export type AIAccessStatus = {
  tier: AIAccessTier;
  model: string;
  fallbackModel: string;
  apiKeySource: AIApiKeySource;
  hasUserOpenAIKey: boolean;
  openAIKeyLast4?: string | null;
  openAIKeyUpdatedAt?: Date | null;
};

type StoredAIAccess = {
  tier?: unknown;
  preferredModel?: unknown;
  openaiKeyEncrypted?: string | null;
  openaiKeyLast4?: string | null;
  openaiKeyUpdatedAt?: Date | null;
};

export type AIAccessRunResult<T> = {
  value: T;
  runtime: AIAccessRuntime;
  notice?: string;
};

const DEFAULT_FREE_MODEL = 'gpt-4o-mini';
const DEFAULT_PREMIUM_MODEL = 'gpt-5';
const ENCRYPTION_VERSION = 'v1';

const normalizeModel = (value: unknown, fallback: string): string => {
  const model = String(value || '').trim();
  return model || fallback;
};

const platformFreeModel = (): string => normalizeModel(process.env.OPENAI_FREE_MODEL, DEFAULT_FREE_MODEL);
const platformPremiumModel = (): string => normalizeModel(process.env.OPENAI_PLATFORM_PREMIUM_MODEL, DEFAULT_PREMIUM_MODEL);

const normalizeTier = (value: unknown): AIAccessTier => {
  const tier = String(value || '').trim().toLowerCase();
  if (tier === 'platform_premium' || tier === 'byok') return tier;
  return 'free';
};

const premiumEmailSet = (): Set<string> =>
  new Set(
    String(process.env.OPENAI_PLATFORM_PREMIUM_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

const isPremiumUser = (user: UserDocument): boolean => {
  const tier = normalizeTier(user.aiAccess?.tier);
  if (tier === 'platform_premium') return true;
  return premiumEmailSet().has(String(user.email || '').trim().toLowerCase());
};

const keyMaterial = (): Buffer => {
  const secret = String(process.env.OPENAI_USER_KEY_ENCRYPTION_SECRET || process.env.JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('OPENAI_USER_KEY_ENCRYPTION_SECRET or JWT_SECRET is required to store user OpenAI keys.');
  }
  return crypto.createHash('sha256').update(secret).digest();
};

export const encryptUserOpenAIKey = (apiKey: string): string => {
  const trimmed = apiKey.trim();
  if (!trimmed.startsWith('sk-') || trimmed.length < 20) {
    throw new Error('OpenAI API key must look like a valid sk-* key.');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyMaterial(), iv);
  const ciphertext = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [ENCRYPTION_VERSION, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':');
};

export const decryptUserOpenAIKey = (encrypted: string): string => {
  const [version, ivRaw, tagRaw, ciphertextRaw] = encrypted.split(':');
  if (version !== ENCRYPTION_VERSION || !ivRaw || !tagRaw || !ciphertextRaw) {
    throw new Error('Unsupported encrypted OpenAI key format.');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyMaterial(), Buffer.from(ivRaw, 'base64'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextRaw, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
};

export const resolveAIAccessRuntime = (user: UserDocument): AIAccessRuntime => {
  const aiAccess = (user.aiAccess || {}) as StoredAIAccess;
  const tier = normalizeTier(aiAccess.tier);
  const fallback = {
    apiKey: process.env.OPENAI_API_KEY,
    model: platformFreeModel(),
    tier: 'free' as const,
    apiKeySource: 'platform' as const,
  };

  if (aiAccess.openaiKeyEncrypted) {
    return {
      apiKey: decryptUserOpenAIKey(aiAccess.openaiKeyEncrypted),
      model: normalizeModel(aiAccess.preferredModel, platformPremiumModel()),
      tier: 'byok',
      apiKeySource: 'user',
      fallback,
    };
  }

  if (tier === 'byok') {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      model: platformFreeModel(),
      tier: 'free',
      apiKeySource: 'platform',
      fallback,
    };
  }

  if (isPremiumUser(user)) {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      model: normalizeModel(aiAccess.preferredModel, platformPremiumModel()),
      tier: 'platform_premium',
      apiKeySource: 'platform',
      fallback,
    };
  }

  return fallback;
};

export const getAIAccessStatus = (user: UserDocument): AIAccessStatus => {
  const aiAccess = (user.aiAccess || {}) as StoredAIAccess;
  const hasUserOpenAIKey = Boolean(aiAccess.openaiKeyEncrypted);
  const tier: AIAccessTier = hasUserOpenAIKey ? 'byok' : isPremiumUser(user) ? 'platform_premium' : 'free';
  const model =
    tier === 'byok' || tier === 'platform_premium'
      ? normalizeModel(aiAccess.preferredModel, platformPremiumModel())
      : platformFreeModel();
  return {
    tier,
    model,
    fallbackModel: platformFreeModel(),
    apiKeySource: hasUserOpenAIKey ? 'user' : 'platform',
    hasUserOpenAIKey,
    openAIKeyLast4: aiAccess.openaiKeyLast4 || null,
    openAIKeyUpdatedAt: aiAccess.openaiKeyUpdatedAt || null,
  };
};

const errorText = (error: unknown): string => {
  const parts: string[] = [];
  let current: any = error;
  for (let depth = 0; current && depth < 4; depth += 1) {
    if (typeof current.message === 'string') parts.push(current.message);
    if (typeof current.code === 'string') parts.push(current.code);
    if (typeof current.status === 'number') parts.push(String(current.status));
    current = current.cause;
  }
  return parts.join(' ').toLowerCase();
};

export const shouldFallbackAIError = (error: unknown): boolean => {
  const text = errorText(error);
  return (
    text.includes('401') ||
    text.includes('429') ||
    text.includes('insufficient_quota') ||
    text.includes('invalid_api_key') ||
    text.includes('quota') ||
    text.includes('rate limit')
  );
};

const fallbackNotice = (runtime: AIAccessRuntime): string | undefined => {
  if (runtime.apiKeySource !== 'user') return undefined;
  return 'Your OpenAI key is unavailable or out of credits, so Evo used the free model for this response. Add credits in OpenAI or keep using the free version.';
};

export async function runWithAIAccess<T>(
  user: UserDocument,
  baseService: OpenAIService,
  action: (service: OpenAIService, runtime: AIAccessRuntime) => Promise<T>
): Promise<AIAccessRunResult<T>> {
  const runtime = resolveAIAccessRuntime(user);
  try {
    return {
      value: await action(baseService.withRuntime(runtime), runtime),
      runtime,
    };
  } catch (error) {
    if (!runtime.fallback || !shouldFallbackAIError(error)) {
      throw error;
    }

    const fallbackRuntime: AIAccessRuntime = {
      ...runtime.fallback,
      fallback: undefined,
    };
    console.warn('[AI Access] Falling back to platform free model', {
      userId: user.id,
      fromModel: runtime.model,
      toModel: fallbackRuntime.model,
      apiKeySource: runtime.apiKeySource,
    });
    return {
      value: await action(baseService.withRuntime(fallbackRuntime), fallbackRuntime),
      runtime: fallbackRuntime,
      notice: fallbackNotice(runtime),
    };
  }
}
