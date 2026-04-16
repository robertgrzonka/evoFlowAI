'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION } from '@/lib/graphql/mutations';
import { setAuthToken } from '@/lib/auth-token';
import { ButtonSpinner } from '@/components/ui/loading';
import EvoMark from '@/components/EvoMark';
import { appToast } from '@/lib/app-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      setAuthToken(data.login.token, rememberMe);
      appToast.success('Welcome back!', 'You are now logged in to evoFlowAI.');
      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error) => {
      appToast.error('Login failed', error.message || 'Please check email and password.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login({
        variables: {
          input: {
            email,
            password,
          },
        },
      });
    } catch (error) {
      // Error handled by onError callback
      console.error('Login error:', error);
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
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-2 text-center">Welcome back</h1>
          <p className="text-sm text-text-secondary text-center mb-6">
            Log in to your account to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input-control"
                  placeholder="••••••••"
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded-sm border-border bg-surface text-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-text-secondary">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary-500 hover:text-primary-400 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <ButtonSpinner />
                  Logging in...
                </>
              ) : 'Log in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

