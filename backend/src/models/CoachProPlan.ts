import mongoose, { Document, Schema } from 'mongoose';

export interface CoachProSignalSnapshot {
  dateKey: string;
  consumedCalories: number;
  consumedProtein: number;
  workoutSessions: number;
  steps: number;
  remainingCalories: number;
  remainingProtein: number;
}

export interface CoachProPlanDocument extends Document {
  userId: string;
  setup: Record<string, any>;
  plan: Record<string, any>;
  generatedAt: Date;
  generationMeta?: {
    generationSource: 'ai' | 'fallback' | 'unknown';
    fallbackReason: string | null;
    generationWarnings: string[];
    normalizationApplied: boolean;
    normalizationSummary: string[];
    normalizedFields: string[];
    shoppingListSource: 'ai' | 'fallback' | 'derived-from-fallback-bases' | 'derived-from-plan' | 'unknown';
    shoppingListWarnings: string[];
    sectionSources: string[];
    fallbackSections: string[];
    generationDebug?: {
      resolver: string;
      aiAttempted: boolean;
      aiSucceeded: boolean;
      fallbackTriggered: boolean;
    };
  };
  lastSignalSnapshot?: CoachProSignalSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

const coachProSignalSnapshotSchema = new Schema<CoachProSignalSnapshot>(
  {
    dateKey: { type: String, required: true },
    consumedCalories: { type: Number, default: 0 },
    consumedProtein: { type: Number, default: 0 },
    workoutSessions: { type: Number, default: 0 },
    steps: { type: Number, default: 0 },
    remainingCalories: { type: Number, default: 0 },
    remainingProtein: { type: Number, default: 0 },
  },
  { _id: false }
);

const coachProPlanSchema = new Schema<CoachProPlanDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    setup: { type: Schema.Types.Mixed, required: true },
    plan: { type: Schema.Types.Mixed, required: true },
    generatedAt: { type: Date, required: true },
    generationMeta: { type: Schema.Types.Mixed, required: false },
    lastSignalSnapshot: { type: coachProSignalSnapshotSchema, required: false },
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

export const CoachProPlan = mongoose.model<CoachProPlanDocument>('CoachProPlan', coachProPlanSchema);
