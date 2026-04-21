'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { RESET_PASSWORD_MUTATION } from '@/lib/graphql/mutations';
import { setAuthToken } from '@/lib/auth-token';
import { resetApolloClientAfterAuthChange } from '@/lib/apollo-client';
import { ButtonSpinner } from '@/components/ui/loading';
import EvoMark from '@/components/EvoMark';
import { appToast } from '@/lib/app-toast';

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD_MUTATION, {
    onCompleted: async (data) => {
      setAuthToken(data.resetPassword.token, true);
      await resetApolloClientAfterAuthChange();
      appToast.success('Password updated', 'You can continue to your dashboard.');
      router.push('/dashboard');
    },
    onError: (error) => {
      appToast.error('Reset failed', error.message || 'Unable to reset password.');
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!resetToken) {
      appToast.error('Invalid link', 'Missing reset token in URL.');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      appToast.warning('Password too short', `Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      appToast.warning('Password mismatch', 'Please make sure both password fields are identical.');
      return;
    }

    try {
      await resetPassword({
        variables: {
          input: {
            token: resetToken,
            newPassword: password,
          },
        },
      });
    } catch (error) {
      console.error('Password reset error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[420px]"
      >
        <Link href="/login" className="inline-flex items-center text-text-secondary hover:text-text-primary mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.9]" />
          Back to login
        </Link>

        <div className="flex items-center justify-center space-x-2 mb-7">
          <EvoMark className="h-6 w-6 text-primary-500" />
          <span className="text-xl font-semibold tracking-tight text-gradient">evoFlowAI</span>
        </div>

        <div className="card-elevated">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-2 text-center">Choose a new password</h1>
          <p className="text-sm text-text-secondary text-center mb-6">
            Set a new password for your account and continue to the dashboard.
          </p>

          {resetToken ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                  New password
                </label>
                <div className="auth-input-wrap">
                  <Lock className="auth-input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="auth-input-control"
                    placeholder="••••••••"
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                  <button
                    type="button"
                    className="auth-input-action"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  At least {MIN_PASSWORD_LENGTH} characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                  Confirm new password
                </label>
                <div className="auth-input-wrap">
                  <Lock className="auth-input-icon" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="auth-input-control"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="auth-input-action"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <ButtonSpinner />
                    Resetting password...
                  </>
                ) : 'Reset password'}
              </button>
            </form>
          ) : (
            <div className="rounded-lg border border-border bg-surface/60 p-4">
              <p className="text-sm text-text-secondary">
                This reset link is missing a token. Generate a new one to continue.
              </p>
              <Link href="/forgot-password" className="inline-block mt-4 text-primary-500 hover:text-primary-400 font-medium transition-colors">
                Generate a new reset link
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
