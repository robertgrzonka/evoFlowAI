'use client';

import { ApolloClient, InMemoryCache, createHttpLink, from, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { ApolloProvider as Provider } from '@apollo/client';
import { ReactNode } from 'react';
import { clearAuthToken, getAuthToken } from '@/lib/auth-token';
import { appToast } from '@/lib/app-toast';

// HTTP Link
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql',
});

// WebSocket Link for subscriptions
const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:3001/graphql',
    connectionParams: () => {
      const token = getAuthToken();
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
  })
) : null;

// Auth Link
const authLink = setContext((_, { headers }) => {
  const token = getAuthToken();
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error Link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`);
      
      // Show user-friendly error messages
      if (message.includes('You must be logged in')) {
        appToast.error('Session expired', 'Please log in again.');
        // Redirect to login
        if (typeof window !== 'undefined') {
          clearAuthToken();
          window.location.href = '/login';
        }
      } else {
        appToast.error('Request failed', message || 'An error occurred.');
      }
    });
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
    appToast.error('Network error', 'Server connection error.');
  }
});

// Split link for HTTP and WebSocket
const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      from([errorLink, authLink, httpLink])
    )
  : from([errorLink, authLink, httpLink]);

// Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        fields: {
          foodItems: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
      Query: {
        fields: {
          myFoodItems: {
            keyArgs: false,
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          myChatHistory: {
            keyArgs: ['channel'],
            merge(existing = [], incoming, { args }) {
              const offset = Number(args?.offset ?? 0);

              // For default query window (offset=0), always refresh from server snapshot
              // to avoid stale chat lists after mutation/subscription race conditions.
              if (offset === 0) {
                return incoming;
              }

              const merged = [...existing, ...incoming];
              const seen = new Set<string>();
              return merged.filter((item: any) => {
                const id = item?.id;
                if (!id) return true;
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
              });
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

// Apollo Provider Component
export function ApolloProvider({ children }: { children: ReactNode }) {
  return <Provider client={client}>{children}</Provider>;
}

export { client };
