import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ApolloProvider } from '@/lib/apollo-client';
import BrowserExtensionErrorGuard from '@/components/BrowserExtensionErrorGuard';
import GlobalToaster from '@/components/GlobalToaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'evoFlowAI - Intelligent Nutrition Analysis',
  description: 'Scan food, analyze macronutrients, and get personalized nutrition advice powered by AI',
  keywords: ['nutrition', 'calories', 'macronutrients', 'AI', 'diet', 'health'],
  authors: [{ name: 'evoFlowAI Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8B4B6B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${inter.className}`}>
        <ApolloProvider>
          <BrowserExtensionErrorGuard />
          <div className="min-h-screen bg-background">
            {children}
          </div>
          <GlobalToaster />
        </ApolloProvider>
      </body>
    </html>
  );
}