'use client';

import dynamic from 'next/dynamic';

const ApolloSandbox = dynamic(() => import('@apollo/sandbox/react').then((mod) => mod.ApolloSandbox), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[480px] items-center justify-center rounded-lg border border-border bg-surface-elevated text-sm text-text-secondary">
      Loading Apollo Sandbox…
    </div>
  ),
});

const defaultEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

export default function ApolloSandboxEmbed() {
  return (
    <div className="h-full min-h-0 w-full">
      <ApolloSandbox
        className="h-full w-full min-h-[560px]"
        initialEndpoint={defaultEndpoint}
        endpointIsEditable
        runTelemetry={false}
        initialState={{ pollForSchemaUpdates: true }}
      />
    </div>
  );
}
