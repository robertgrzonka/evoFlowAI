import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User as IUser, UserPreferences } from '@evoflowai/shared';

export interface UserDocument extends Omit<IUser, 'id'>, Document {
  password: string;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userPreferencesSchema = new Schema<UserPreferences>({
  dailyCalorieGoal: { type: Number, default: 2000 },
  proteinGoal: { type: Number, default: 150 },
  carbsGoal: { type: Number, default: 200 },
  fatGoal: { type: Number, default: 67 },
  weeklyWorkoutsGoal: { type: Number, default: 4 },
  weeklyActiveMinutesGoal: { type: Number, default: 180 },
  primaryGoal: {
    type: String,
    enum: ['fat_loss', 'maintenance', 'muscle_gain', 'strength'],
    default: 'maintenance'
  },
  dietaryRestrictions: [{ type: String }],
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: 'moderate'
  },
  notifications: { type: Boolean, default: true }
});

const userSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  passwordResetTokenHash: {
    type: String,
    required: false
  },
  passwordResetExpiresAt: {
    type: Date,
    required: false
  },
  name: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  preferences: {
    type: userPreferencesSchema,
    default: () => ({
      dailyCalorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 200,
      fatGoal: 67,
      weeklyWorkoutsGoal: 4,
      weeklyActiveMinutesGoal: 180,
      primaryGoal: 'maintenance',
      dietaryRestrictions: [],
      activityLevel: 'moderate',
      notifications: true
    })
  }
}, {
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.passwordResetTokenHash;
      delete ret.passwordResetExpiresAt;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<UserDocument>('User', userSchema);
