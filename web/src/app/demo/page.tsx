'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back to home */}
        <Link href="/" className="inline-flex items-center text-text-secondary hover:text-text-primary mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.9]" />
          Back to home
        </Link>

        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-10">
          <Sparkles className="h-9 w-9 text-primary-500 stroke-[1.9]" />
          <span className="text-3xl font-semibold tracking-tight text-gradient">evoFlowAI</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-center"
        >
          <h1 className="text-4xl font-semibold tracking-tight text-text-primary mb-5">
            Interactive Demo
          </h1>
          <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto">
            Experience the power of AI-driven nutrition analysis
          </p>

          <div className="card-elevated max-w-3xl mx-auto">
            <div className="aspect-video bg-surface-elevated rounded-lg flex items-center justify-center mb-6">
              <div className="text-center">
                <Sparkles className="h-20 w-20 text-primary-500 stroke-[1.7] mx-auto mb-4" />
                <p className="text-text-secondary text-lg">
                  Demo video coming soon
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="p-5 bg-surface rounded-lg">
                <h3 className="text-lg font-semibold tracking-tight text-text-primary mb-2">📸 Log Meal</h3>
                <p className="text-text-secondary">
                  Describe or upload meal photo and get instant macronutrient analysis
                </p>
              </div>
              <div className="p-5 bg-surface rounded-lg">
                <h3 className="text-lg font-semibold tracking-tight text-text-primary mb-2">📊 Track Stats</h3>
                <p className="text-text-secondary">
                  Monitor your daily, weekly, and monthly nutrition
                </p>
              </div>
              <div className="p-5 bg-surface rounded-lg">
                <h3 className="text-lg font-semibold tracking-tight text-text-primary mb-2">💬 AI Chat</h3>
                <p className="text-text-secondary">
                  Get personalized nutrition advice from AI
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-4 justify-center">
              <Link href="/register" className="btn-primary h-10 px-5">
                Start Free Trial
              </Link>
              <Link href="/login" className="btn-secondary h-10 px-5">
                Log In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

