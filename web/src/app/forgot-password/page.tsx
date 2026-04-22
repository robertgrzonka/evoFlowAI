'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { REQUEST_PASSWORD_RESET_MUTATION } from '@/lib/graphql/mutations';
import { ButtonSpinner } from '@/components/ui/loading';
import EvoMark from '@/components/EvoMark';
import { appToast } from '@/lib/app-toast';
import { authPagesCopy } from '@/lib/i18n/copy/auth-pages';
import { usePublicUiLocale } from '@/lib/i18n/use-public-ui-locale';

export default function ForgotPasswordPage() {
  const locale = usePublicUiLocale();
  const c = authPagesCopy[locale].forgot;
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const [requestPasswordReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET_MUTATION, {
    onCompleted: (data) => {
      const payload = data.requestPasswordReset;
      setSubmittedEmail(email);
      setResetUrl(payload.resetUrl ?? null);
      appToast.success(c.toastResetTitle, payload.message || '');
    },
    onError: (error) => {
      appToast.error(c.toastFailTitle, error.message || c.toastFailBody);
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await requestPasswordReset({
        variables: {
          input: {
            email,
          },
        },
      });
    } catch (error) {
      console.error('Password reset request error:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!resetUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(resetUrl);
      appToast.success(c.toastCopiedTitle, c.toastCopiedBody);
    } catch (error) {
      appToast.error(c.toastCopyFailTitle, c.toastCopyFailBody);
      console.error('Copy reset link error:', error);
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
          {c.backLogin}
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
                  onChange={(event) => setEmail(event.target.value)}
                  className="auth-input-control"
                  placeholder="your@email.com"
                />
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
                  {c.submitting}
                </>
              ) : (
                c.submit
              )}
            </button>
          </form>

          {submittedEmail ? (
            <div className="mt-6 rounded-lg border border-border bg-surface/60 p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-text-primary">{c.requestReceived}</p>
                <p className="text-sm text-text-secondary">
                  {c.requestBody.replace('{email}', submittedEmail)}
                </p>
              </div>

              {resetUrl ? (
                <>
                  <div>
                    <label htmlFor="resetUrl" className="block text-sm font-medium text-text-primary mb-2">
                      {c.resetLinkLabel}
                    </label>
                    <input id="resetUrl" type="text" readOnly value={resetUrl} className="input-field w-full text-sm" />
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={handleCopyLink} className="btn-secondary flex-1">
                      {c.copyLink}
                    </button>
                    <a href={resetUrl} className="btn-primary flex-1 text-center">
                      {c.openLink}
                    </a>
                  </div>
                </>
              ) : (
                <p className="text-sm text-text-secondary">{c.linkUnavailable}</p>
              )}
            </div>
          ) : null}

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              {c.remembered}{' '}
              <Link href="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
                {c.logIn}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
