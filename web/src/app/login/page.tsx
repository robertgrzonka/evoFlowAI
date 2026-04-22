'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION } from '@/lib/graphql/mutations';
import { setAuthToken } from '@/lib/auth-token';
import { resetApolloClientAfterAuthChange } from '@/lib/apollo-client';
import { ButtonSpinner } from '@/components/ui/loading';
import EvoMark from '@/components/EvoMark';
import { appToast } from '@/lib/app-toast';
import { authPagesCopy } from '@/lib/i18n/copy/auth-pages';
import { usePublicUiLocale } from '@/lib/i18n/use-public-ui-locale';

export default function LoginPage() {
  const router = useRouter();
  const locale = usePublicUiLocale();
  const c = authPagesCopy[locale].login;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: async (data) => {
      setAuthToken(data.login.token, rememberMe);
      await resetApolloClientAfterAuthChange();
      appToast.success(c.toastWelcomeTitle, c.toastWelcomeBody);
      router.push('/dashboard');
    },
    onError: (error) => {
      appToast.error(c.toastLoginFailTitle, error.message || c.toastLoginFailBody);
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
        <Link href="/" className="inline-flex items-center text-text-secondary hover:text-text-primary mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.9]" />
          {c.backHome}
        </Link>

        <div className="flex items-center justify-center space-x-2 mb-7">
          <EvoMark className="h-6 w-6 text-primary-500" />
          <span className="text-xl font-semibold tracking-tight text-gradient">evoFlowAI</span>
        </div>

        <div className="card-elevated">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-2 text-center">{c.title}</h1>
          <p className="text-sm text-text-secondary text-center mb-6">{c.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                {c.email}
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
                {c.password}
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
                  title={showPassword ? c.hidePassword : c.showPassword}
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
                <span className="ml-2 text-sm text-text-secondary">{c.rememberMe}</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary-500 hover:text-primary-400 transition-colors">
                {c.forgotPassword}
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
                  {c.submitting}
                </>
              ) : (
                c.submit
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              {c.noAccount}{' '}
              <Link href="/register" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
                {c.signUp}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
