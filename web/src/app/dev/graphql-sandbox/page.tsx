import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ApolloSandboxEmbed from '@/components/dev/ApolloSandboxEmbed';

export default function DevGraphqlSandboxPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="shrink-0 border-b border-border bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to app
            </Link>
            <h1 className="text-sm font-semibold text-text-primary">GraphQL Sandbox (dev)</h1>
          </div>
          <p className="text-xs text-text-muted">
            Endpoint:{' '}
            <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-text-secondary">
              {process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql'}
            </code>
            {' · '}
            Run the API server separately on port 3001.
          </p>
        </div>
      </header>
      <main className="min-h-0 flex-1 px-2 pb-2 pt-2 sm:px-4">
        <div className="mx-auto flex h-[calc(100vh-5.5rem)] max-w-[1600px] flex-col">
          <ApolloSandboxEmbed />
        </div>
      </main>
    </div>
  );
}
