import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { ApolloServer } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { createContext, onConnect } from './graphql/context';

const app = express();
const httpServer = createServer(app);

function mongooseConnectionLabel(): string {
  const labels = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const rs = mongoose.connection.readyState;
  return rs >= 0 && rs < labels.length ? labels[rs] : 'unknown';
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check (always 200 for load balancers; `mongodb` shows driver state)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongooseConnectionLabel(),
    mongodbReadyState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
  });
});

// Create GraphQL schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create Apollo Server
const apolloServer = new ApolloServer({
  schema,
  context: createContext as any,
});

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Start server — HTTP must listen before Mongo so platform healthchecks (e.g. Railway) see /health quickly.
async function startServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app: app as any, path: '/graphql' });

  // WebSocket Server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  useServer({ schema }, wsServer);

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 evoFlowAI server listening on http://${HOST}:${PORT}`);
      console.log(`📊 GraphQL endpoint: http://${HOST}:${PORT}${apolloServer.graphqlPath}`);
      console.log(`🔌 WebSocket endpoint: ws://${HOST}:${PORT}/graphql`);
      resolve();
    });
    httpServer.on('error', reject);
  });

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evoflowai');
  console.log('✅ Connected to MongoDB');
}

startServer().catch((error) => {
  console.error('❌ Server startup error:', error);
  process.exit(1);
});
