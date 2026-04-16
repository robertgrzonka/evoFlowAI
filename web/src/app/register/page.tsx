'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { REGISTER_MUTATION } from '@/lib/graphql/mutations';
import { setAuthToken } from '@/lib/auth-token';
import { ButtonSpinner } from '@/components/ui/loading';
import EvoMark from '@/components/EvoMark';
import { appToast } from '@/lib/app-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [register, { loading }] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      setAuthToken(data.register.token, true);
      appToast.success('Account created', 'Welcome to evoFlowAI. Let us build your momentum.');
      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error) => {
      appToast.error('Registration failed', error.message || 'Could not create account.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      appToast.warning('Password mismatch', 'Please make sure both password fields are identical.');
      return;
    }

    if (password.length < 6) {
      appToast.warning('Password too short', 'Use at least 6 characters.');
      return;
    }

    try {
      await register({
        variables: {
          input: {
            name,
            email,
            password,
          },
        },
      });
    } catch (error) {
      // Error handled by onError callback
      console.error('Registration error:', error);
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
        {/* Back to home */}
        <Link href="/" className="inline-flex items-center text-text-secondary hover:text-text-primary mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.9]" />
          Back to home
        </Link>

        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-7">
          <EvoMark className="h-6 w-6 text-primary-500" />
          <span className="text-xl font-semibold tracking-tight text-gradient">evoFlowAI</span>
        </div>

        {/* Card */}
        <div className="card-elevated">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-2 text-center">Create account</h1>
          <p className="text-sm text-text-secondary text-center mb-6">
            Start your journey to better nutrition
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                Full Name
              </label>
              <div className="auth-input-wrap">
                <User className="auth-input-icon" />
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input-control"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                Email
              </label>
              <div className="auth-input-wrap">
                <Mail className="auth-input-icon" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input-control"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                Password
              </label>
              <div className="auth-input-wrap">
                <Lock className="auth-input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input-control"
                  placeholder="••••••••"
                  minLength={6}
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
              <p className="mt-1 text-xs text-text-muted">At least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                Confirm Password
              </label>
              <div className="auth-input-wrap">
                <Lock className="auth-input-icon" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Creating account...
                </>
              ) : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

