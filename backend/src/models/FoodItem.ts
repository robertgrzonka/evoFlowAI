import mongoose, { Schema, Document } from 'mongoose';
import { FoodItem as IFoodItem, NutritionInfo, MealType } from '@evoflowai/shared';

export interface FoodItemDocument extends Omit<IFoodItem, 'id'>, Document { }

const nutritionInfoSchema = new Schema<NutritionInfo>({
  calories: { type: Number, required: true, min: 0 },
  protein: { type: Number, required: true, min: 0 },
  carbs: { type: Number, required: true, min: 0 },
  fat: { type: Number, required: true, min: 0 },
  fiber: { type: Number, min: 0 },
  sugar: { type: Number, min: 0 },
  sodium: { type: Number, min: 0 },
  confidence: { type: Number, required: true, min: 0, max: 1 }
});

const foodItemSchema = new Schema<FoodItemDocument>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  nutrition: {
    type: nutritionInfoSchema,
    required: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
foodItemSchema.index({ userId: 1, createdAt: -1 });
foodItemSchema.index({ userId: 1, mealType: 1 });

export const FoodItem = mongoose.model<FoodItemDocument>('FoodItem', foodItemSchema);
