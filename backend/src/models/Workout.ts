import mongoose, { Document, Schema } from 'mongoose';

export type WorkoutIntensity = 'low' | 'medium' | 'high';

export interface WorkoutDocument extends Document {
  userId: string;
  title: string;
  notes?: string;
  durationMinutes: number;
  caloriesBurned: number;
  intensity: WorkoutIntensity;
  performedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workoutSchema = new Schema<WorkoutDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    caloriesBurned: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    intensity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
      default: 'medium',
    },
    performedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

workoutSchema.index({ userId: 1, performedAt: -1 });

export const Workout = mongoose.model<WorkoutDocument>('Workout', workoutSchema);
