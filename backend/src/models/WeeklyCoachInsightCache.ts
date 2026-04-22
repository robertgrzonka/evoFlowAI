import mongoose, { Schema, Document } from 'mongoose';

export type WeeklyCoachInsightKind = 'meals' | 'workouts';

export interface WeeklyCoachInsightCacheDocument extends Document {
  userId: string;
  kind: WeeklyCoachInsightKind;
  /** Inclusive end date of the 7-day window (YYYY-MM-DD), matches summary.weekEnd from loaders. */
  weekEnd: string;
  fingerprint: string;
  headline: string;
  summary: string;
  focusAreas: string[];
  improvements: string[];
  closingLine: string;
  updatedAt: Date;
}

const weeklyCoachInsightCacheSchema = new Schema<WeeklyCoachInsightCacheDocument>(
  {
    userId: { type: String, required: true, index: true },
    kind: { type: String, required: true, enum: ['meals', 'workouts'] },
    weekEnd: { type: String, required: true },
    fingerprint: { type: String, required: true },
    headline: { type: String, required: true },
    summary: { type: String, required: true },
    focusAreas: { type: [String], required: true },
    improvements: { type: [String], required: true },
    closingLine: { type: String, required: true },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

weeklyCoachInsightCacheSchema.index({ userId: 1, kind: 1, weekEnd: 1 }, { unique: true });

export const WeeklyCoachInsightCache = mongoose.model<WeeklyCoachInsightCacheDocument>(
  'WeeklyCoachInsightCache',
  weeklyCoachInsightCacheSchema
);
