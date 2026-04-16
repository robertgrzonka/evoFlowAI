import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ApolloProvider } from '@/lib/apollo-client';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'evoFlowAI - Intelligent Nutrition Analysis',
  description: 'Scan food, analyze macronutrients, and get personalized nutrition advice powered by AI',
  keywords: ['nutrition', 'calories', 'macronutrients', 'AI', 'diet', 'health'],
  authors: [{ name: 'evoFlowAI Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#8B4B6B',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
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
          <div className="min-h-screen bg-background">
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a1a',
                color: '#ffffff',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#8B4B6B',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </ApolloProvider>
      </body>
    </html>
  );
}