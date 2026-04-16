import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { User } from '../../models/User';
import { Context } from '../context';

const PASSWORD_MIN_LENGTH = 6;

const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(
    { userId }, 
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  );
};

const getPasswordResetTtlMs = (): number => {
  const ttlMinutes = Number(process.env.PASSWORD_RESET_TTL_MINUTES || '30');
  return ttlMinutes * 60 * 1000;
};

const isLocalPasswordResetEnabled = (): boolean =>
  process.env.ENABLE_LOCAL_PASSWORD_RESET === 'true';

const hashResetToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const buildPasswordResetUrl = (token: string): string => {
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${appUrl}/reset-password?token=${token}`;
};

export const authResolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      return context.user;
    },
  },

  Mutation: {
    register: async (_: any, { input }: { input: any }) => {
      const { email, password, name } = input;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new UserInputError('User with this email already exists');
      }

      // Password validation
      if (password.length < PASSWORD_MIN_LENGTH) {
        throw new UserInputError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      }

      // Create new user
      const user = new User({
        email,
        password,
        name: name || email.split('@')[0], // Use email prefix if no name provided
      });

      await user.save();

      const token = generateToken(user._id.toString());

      return {
        token,
        user,
      };
    },

    login: async (_: any, { input }: { input: any }) => {
      const { email, password } = input;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw new AuthenticationError('Invalid email or password');
      }

      const token = generateToken(user._id.toString());

      return {
        token,
        user,
      };
    },

    requestPasswordReset: async (_: any, { input }: { input: any }) => {
      const email = input.email.trim().toLowerCase();
      const user = await User.findOne({ email });
      const message = 'If an account with that email exists, a reset link has been generated.';

      if (!user) {
        return {
          success: true,
          message,
          resetUrl: null,
        };
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetTokenHash = hashResetToken(resetToken);
      user.passwordResetExpiresAt = new Date(Date.now() + getPasswordResetTtlMs());
      await user.save();

      return {
        success: true,
        message,
        resetUrl: isLocalPasswordResetEnabled() ? buildPasswordResetUrl(resetToken) : null,
      };
    },

    resetPassword: async (_: any, { input }: { input: any }) => {
      const { token, newPassword } = input;

      if (newPassword.length < PASSWORD_MIN_LENGTH) {
        throw new UserInputError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      }

      const user = await User.findOne({
        passwordResetTokenHash: hashResetToken(token),
        passwordResetExpiresAt: { $gt: new Date() },
      });

      if (!user) {
        throw new UserInputError('Invalid or expired password reset token');
      }

      user.password = newPassword;
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();

      const authToken = generateToken(user._id.toString());

      return {
        token: authToken,
        user,
      };
    },
  },
};
