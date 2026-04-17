import mongoose, { Document, Schema } from 'mongoose';

export type StepSyncProvider = 'GARMIN';
export type StepSyncStatus = 'DISCONNECTED' | 'CONNECTED' | 'ERROR';

export interface StepSyncConnectionDocument extends Document {
  userId: string;
  provider: StepSyncProvider;
  status: StepSyncStatus;
  apiToken?: string;
  lastSyncedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const stepSyncConnectionSchema = new Schema<StepSyncConnectionDocument>(
  {
    userId: { type: String, required: true, index: true },
    provider: { type: String, enum: ['GARMIN'], required: true },
    status: { type: String, enum: ['DISCONNECTED', 'CONNECTED', 'ERROR'], default: 'DISCONNECTED' },
    apiToken: { type: String, required: false },
    lastSyncedAt: { type: Date, required: false },
    lastError: { type: String, required: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.apiToken;
        return ret;
      },
    },
  }
);

stepSyncConnectionSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const StepSyncConnection = mongoose.model<StepSyncConnectionDocument>(
  'StepSyncConnection',
  stepSyncConnectionSchema
);
