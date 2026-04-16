'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, ChartColumnIncreasing, MessageSquareMore, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { hasAuthToken } from '@/lib/auth-token';

export default function HomePage() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to dashboard if user is already logged in
    if (hasAuthToken()) {
      router.push('/dashboard');
    }
  }, [router]);

  const features = [
    {
      id: 'scan',
      icon: Camera,
      title: 'Log Meal',
      description: 'Describe your meal or upload a photo for instant AI calorie and macro analysis',
      color: 'from-primary-500 to-primary-600'
    },
    {
      id: 'stats',
      icon: ChartColumnIncreasing,
      title: 'Track Progress',
      description: 'View daily, weekly, monthly, and yearly summaries of your nutrition',
      color: 'from-info-500 to-info-600'
    },
    {
      id: 'chat',
      icon: MessageSquareMore,
      title: 'Chat with AI',
      description: 'Get personalized advice, recommendations, and answers to nutrition questions',
      color: 'from-success-500 to-success-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      {/* Navigation */}
      <nav className="glass-effect fixed top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-7 w-7 text-primary-500 stroke-[1.9]" />
              <span className="text-lg font-semibold tracking-tight text-gradient">evoFlowAI</span>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/login" className="btn-ghost">
                Login
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
              <span className="text-gradient">Intelligent</span>
              <br />
              <span className="text-text-primary">Nutrition Analysis</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-text-secondary mb-7 max-w-2xl mx-auto">
              Scan food, analyze macronutrients, and receive personalized nutrition advice 
              powered by advanced artificial intelligence
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="btn-primary h-10 px-5 inline-flex items-center">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4 stroke-[1.9]" />
              </Link>
              <Link href="/demo" className="btn-secondary h-10 px-5 inline-flex items-center">
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Everything you need
            </h2>
            <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto">
              Comprehensive tool for monitoring and optimizing your nutrition
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
                viewport={{ once: true }}
                onMouseEnter={() => setIsHovered(feature.id)}
                onMouseLeave={() => setIsHovered(null)}
                className="nutrition-card group"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-border-light/50 bg-surface-elevated/80 text-text-primary transition-transform duration-200 ease-out group-hover:scale-[1.03]`}>
                  <feature.icon className="h-[18px] w-[18px] stroke-[1.9]" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-2 text-text-primary">
                  {feature.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isHovered === feature.id ? '100%' : '0%' }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`h-0.5 bg-gradient-to-r ${feature.color} mt-4`}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="stat-card"
            >
              <div className="text-3xl font-bold tracking-tight text-success-500 mb-2">95%</div>
              <div className="text-text-secondary">AI Analysis Accuracy</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="stat-card"
            >
              <div className="text-3xl font-bold tracking-tight text-info-500 mb-2">10k+</div>
              <div className="text-text-secondary">Meals Analyzed</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.16, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="stat-card"
            >
              <div className="text-3xl font-bold tracking-tight text-primary-500 mb-2">24/7</div>
              <div className="text-text-secondary">AI Assistant Availability</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
              Ready for <span className="text-gradient">change</span>?
            </h2>
            <p className="text-base md:text-lg text-text-secondary mb-7">
              Join thousands of users who have already improved their nutrition habits with evoFlowAI
            </p>
            <Link href="/register" className="btn-primary h-10 px-5 inline-flex items-center">
              Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4 stroke-[1.9]" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary-500 stroke-[1.9]" />
            <span className="text-base font-semibold tracking-tight text-gradient">evoFlowAI</span>
          </div>
          <p className="text-sm text-text-muted">
            © 2025 evoFlowAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
