import mongoose, { Schema, Document } from 'mongoose';

export interface DashboardInsightCacheDocument extends Document {
  userId: string;
  /** Calendar day YYYY-MM-DD (same as dashboardInsight date). */
  date: string;
  fingerprint: string;
  summary: string;
  tips: string[];
  updatedAt: Date;
}

const dashboardInsightCacheSchema = new Schema<DashboardInsightCacheDocument>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    fingerprint: { type: String, required: true },
    summary: { type: String, required: true },
    tips: { type: [String], required: true },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

dashboardInsightCacheSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DashboardInsightCache = mongoose.model<DashboardInsightCacheDocument>(
  'DashboardInsightCache',
  dashboardInsightCacheSchema
);
