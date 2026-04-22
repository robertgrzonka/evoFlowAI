# evoFlowAI - Installation Guide

## System Requirements

### Backend
- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Web
- Node.js 18+
- npm or yarn

### iOS
- Xcode 15+
- iOS 17+
- macOS Ventura+

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd evoflowai
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm run install:all

# Or manually:
npm install
cd backend && npm install
cd ../web && npm install
cd ../shared && npm install
```

### 3. Environment Configuration

#### Backend
```bash
cd backend
cp .env.example .env
```

Edit the `.env` file and configure:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `OPENAI_API_KEY` - OpenAI API key

**MongoDB Atlas (local dev or tests)**  
Set `MONGODB_URI` in `backend/.env` to your Atlas SRV string and **include the database name** in the path (this project uses `evoflowai`, same as `mongodb://localhost:27017/evoflowai`). Example shape: `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/evoflowai?appName=...`  
URL-encode special characters in the password (for example `!` as `%21`). In Atlas **Network Access**, allow your current IP (or temporarily `0.0.0.0/0` for local-only experiments).  
`npm run dev:backend` loads `backend/.env` via `dotenv` in `src/server.ts`. `npm test` in `backend/` loads the same file from `jest.setup.cjs` so tests use the same `MONGODB_URI` (and other vars) as local dev.

**Docker Compose (`docker-compose.local.yml`)**  
You can set `MONGODB_URI` in a **repo root** `.env` file; Compose will pass it to the backend service (see variable default in the compose file). The local `mongodb` service still starts unless you change the file; it is unused when the backend points at Atlas.

#### Web
```bash
cd web
cp .env.local.example .env.local
```

Configure:
- `NEXT_PUBLIC_GRAPHQL_URL` - GraphQL API URL
- `NEXT_PUBLIC_GRAPHQL_WS_URL` - WebSocket URL

### 4. Running

#### Development
```bash
# Run backend and web simultaneously
npm run dev

# Or separately:
npm run dev:backend  # Port 3001
npm run dev:web      # Port 3000
```

#### iOS
1. Open `ios/evoFlowAI.xcodeproj` in Xcode
2. Configure Team and Bundle Identifier
3. Run on simulator or device

### 5. Production Build
```bash
npm run build
```

## Project Structure

```
evoflowai/
├── backend/           # GraphQL API (Node.js + Apollo)
│   ├── src/
│   │   ├── graphql/   # Schema and resolvers
│   │   ├── models/    # MongoDB models
│   │   └── services/  # Business logic
│   └── package.json
├── web/               # Next.js Application
│   ├── src/
│   │   ├── app/       # App Router
│   │   ├── components/# React Components
│   │   └── lib/       # Apollo Client
│   └── package.json
├── ios/               # iOS App (SwiftUI)
│   ├── evoFlowAI/
│   │   ├── Views/     # SwiftUI Views
│   │   ├── Models/    # Data Models
│   │   └── Services/  # API and Logic
│   └── evoFlowAI.xcodeproj
├── shared/            # Shared TypeScript Types
│   ├── src/
│   │   └── types.ts
│   └── package.json
└── docs/              # Documentation
```

## Features

### ✅ Implemented
- [x] Monorepo structure
- [x] GraphQL API with Apollo Server
- [x] Next.js with dark theme
- [x] SwiftUI with dark theme
- [x] Shared TypeScript types
- [x] Tailwind CSS configuration
- [x] Apollo Client with subscriptions

### 🚧 To Implement
- [ ] JWT Authorization
- [ ] OpenAI Vision API integration
- [ ] Image upload and analysis
- [ ] AI Chat
- [ ] Statistics and charts
- [ ] Real-time synchronization
- [ ] Push notifications (iOS)
- [ ] Core Data (iOS)

## API Endpoints

### GraphQL
- **URL**: `http://localhost:3001/graphql`
- **WebSocket**: `ws://localhost:3001/graphql`

### Main Operations:
- `register` - User registration
- `login` - User login
- `analyzeImage` - Analyze food image
- `myFoodItems` - Get user's meals list
- `sendMessage` - Send message to AI
- `getStats` - Get nutrition statistics

## Application Colors

### Dark Theme Palette
- **Background**: `#0a0a0a` (darkest)
- **Surface**: `#1a1a1a` (cards, panels)
- **Surface Elevated**: `#2a2a2a` (modals, dropdowns)
- **Primary**: `#8B4B6B` (dark pink - accent)
- **Text Primary**: `#ffffff` (primary text)
- **Text Secondary**: `#d1d5db` (secondary text)
- **Border**: `#374151` (borders)

## Docker Deployment

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables for Docker
Make sure to set the following in your `.env` file:
- `OPENAI_API_KEY` - Your OpenAI API key
- MongoDB credentials (already configured in docker-compose.yml)

## Troubleshooting

In case of issues:
1. Check console logs
2. Make sure all services are running
3. Verify `.env` configuration
4. Restart development servers
5. Clear cache and rebuild: `npm run build`

## Support

For more information:
- Check the [main README](../README.md)
- Review GraphQL schema in `backend/src/graphql/schema.ts`
- Inspect shared types in `shared/src/types.ts`

## License

MIT License - See LICENSE file for details.
