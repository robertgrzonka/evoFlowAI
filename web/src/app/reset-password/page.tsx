'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { RESET_PASSWORD_MUTATION } from '@/lib/graphql/mutations';
import { setAuthToken } from '@/lib/auth-token';
import { ButtonSpinner } from '@/components/ui/loading';

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD_MUTATION, {
    onCompleted: (data) => {
      setAuthToken(data.resetPassword.token, true);
      toast.success('Password reset successfully');
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to reset password');
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!resetToken) {
      toast.error('Missing reset token');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
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
          <Sparkles className="h-6 w-6 text-primary-500 stroke-[1.9]" />
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
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-field w-full"
                  placeholder="••••••••"
                  minLength={MIN_PASSWORD_LENGTH}
                />
                <p className="mt-1 text-xs text-text-muted">
                  At least {MIN_PASSWORD_LENGTH} characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="input-field w-full"
                  placeholder="••••••••"
                />
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
