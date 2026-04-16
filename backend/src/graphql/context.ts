import jwt from 'jsonwebtoken';
import { AuthenticationError } from 'apollo-server-express';
import { User, UserDocument } from '../models/User';
import { PubSub } from 'graphql-subscriptions';

export interface Context {
  user?: UserDocument;
  pubsub: PubSub;
}

export const pubsub = new PubSub();

export const createContext = async ({ req, connection }: any): Promise<Context> => {
  // Dla WebSocket connections (subscriptions)
  if (connection) {
    return {
      user: connection.context.user,
      pubsub,
    };
  }

  // For HTTP requests
  let user: UserDocument | undefined;

  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const foundUser = await User.findById(decoded.userId);
      user = foundUser || undefined;
    } catch (error) {
      // Token is invalid, but we don't throw error here
      // Allow public queries
    }
  }

  return {
    user,
    pubsub,
  };
};

// Middleware for checking subscription authorization
export const onConnect = async (connectionParams: any) => {
  const token = connectionParams.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId);
      return { user };
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  }
  
  return {};
};
