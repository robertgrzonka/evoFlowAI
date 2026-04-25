import mongoose, { Schema, Document } from 'mongoose';

export interface WeeklyEvoReviewCacheDocument extends Document {
  userId: string;
  /** Inclusive end date of the week (YYYY-MM-DD), same as weeklyEvoReview.endDate. */
  weekEnd: string;
  fingerprint: string;
  summary: string;
  proTip: string;
  /** [nutrition, training, consistency] — aligned with score pills on the dashboard. */
  highlights: string[];
  updatedAt: Date;
}

const weeklyEvoReviewCacheSchema = new Schema<WeeklyEvoReviewCacheDocument>(
  {
    userId: { type: String, required: true, index: true },
    weekEnd: { type: String, required: true },
    fingerprint: { type: String, required: true },
    summary: { type: String, required: true },
    proTip: { type: String, required: true },
    highlights: { type: [String], required: true },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

weeklyEvoReviewCacheSchema.index({ userId: 1, weekEnd: 1 }, { unique: true });

export const WeeklyEvoReviewCache = mongoose.model<WeeklyEvoReviewCacheDocument>(
  'WeeklyEvoReviewCache',
  weeklyEvoReviewCacheSchema
);
