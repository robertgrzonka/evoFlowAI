import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';
import { authResolvers } from './auth';
import { userResolvers } from './user';
import { foodResolvers } from './food';
import { chatResolvers } from './chat';
import { statsResolvers } from './stats';
import { recommendationResolvers } from './recommendations';
import { workoutResolvers } from './workout';

// Custom scalar for Date
const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

export const resolvers = {
  Date: dateScalar,
  UserPreferences: userResolvers.UserPreferences,
  Workout: workoutResolvers.Workout,
  ChatMessage: chatResolvers.ChatMessage,
  
  Query: {
    ...authResolvers.Query,
    ...userResolvers.Query,
    ...foodResolvers.Query,
    ...chatResolvers.Query,
    ...statsResolvers.Query,
    ...recommendationResolvers.Query,
    ...workoutResolvers.Query,
  },
  
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...foodResolvers.Mutation,
    ...chatResolvers.Mutation,
    ...statsResolvers.Mutation,
    ...recommendationResolvers.Mutation,
    ...workoutResolvers.Mutation,
  },
  
  Subscription: {
    ...foodResolvers.Subscription,
    ...chatResolvers.Subscription,
    ...statsResolvers.Subscription,
    ...recommendationResolvers.Subscription,
    ...workoutResolvers.Subscription,
  },
};