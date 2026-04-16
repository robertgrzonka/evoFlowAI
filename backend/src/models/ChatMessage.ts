import mongoose, { Document, Schema } from 'mongoose';

export interface ChatMessageDocument extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  role: 'USER' | 'ASSISTANT';
  timestamp: Date;
  context?: {
    relatedFoodItems?: string[];
    statsReference?: string;
  };
}

const chatMessageSchema = new Schema<ChatMessageDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['USER', 'ASSISTANT'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  context: {
    relatedFoodItems: [String],
    statsReference: String
  }
}, {
  timestamps: true,
  collection: 'chatmessages'
});

// Index for efficient queries
chatMessageSchema.index({ userId: 1, timestamp: -1 });

export const ChatMessage = mongoose.model<ChatMessageDocument>('ChatMessage', chatMessageSchema);

