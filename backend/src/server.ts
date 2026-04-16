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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evoflowai')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

const PORT = process.env.PORT || 3001;

// Start server
async function startServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app: app as any, path: '/graphql' });

  // WebSocket Server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  useServer({ schema }, wsServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀 evoFlowAI server running on port ${PORT}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`);
    console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error) => {
  console.error('❌ Server startup error:', error);
  process.exit(1);
});
