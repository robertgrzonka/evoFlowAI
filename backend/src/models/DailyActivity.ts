import mongoose, { Document, Schema } from 'mongoose';

export interface DailyActivityDocument extends Document {
  userId: string;
  date: string; // YYYY-MM-DD
  steps: number;
  /** Planned / manual extra calorie budget for this day (walk you intend, etc.) — additive to base goal + logged workout burn. */
  activityBonusKcal: number;
  createdAt: Date;
  updatedAt: Date;
}

const dailyActivitySchema = new Schema<DailyActivityDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    steps: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    activityBonusKcal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

dailyActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyActivity = mongoose.model<DailyActivityDocument>('DailyActivity', dailyActivitySchema);
