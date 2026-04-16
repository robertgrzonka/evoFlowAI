# evoFlowAI - Intelligent Nutrition Analysis Application 🍎✨

A modern iOS mobile app and desktop web application for macronutrient and calorie analysis powered by artificial intelligence.

## 🎨 Design System - Dark Theme

The application uses an elegant dark theme with a color palette:
- **Black**: `#0a0a0a` (main background)
- **White**: `#ffffff` (primary text)  
- **Grays**: `#1a1a1a`, `#2a2a2a`, `#374151` (surfaces, borders)
- **Dark Pink**: `#8B4B6B` (primary accent)

## 🏗️ Monorepo Architecture

```
evoflowai/
├── ios/                    # iOS App (SwiftUI)
│   ├── evoFlowAI/         # Source code
│   └── evoFlowAI.xcodeproj  # Xcode project
├── web/                    # Next.js Application
│   ├── src/app/           # App Router
│   ├── src/components/    # React Components
│   └── src/lib/           # Apollo Client
├── backend/                # GraphQL API
│   ├── src/graphql/       # Schema and resolvers
│   ├── src/models/        # MongoDB models
│   └── src/services/      # OpenAI integration
├── shared/                 # Shared TypeScript types
└── docs/                   # Documentation
```

## ✨ Features

### 📱 iOS App (SwiftUI)
- 📸 **AI Scanning**: Take a photo of your food → AI analyzes macronutrients
- 📊 **Statistics**: Daily, weekly, monthly, and yearly nutrition summaries
- 💬 **AI Chat**: Personalized nutrition advice in real-time
- 🎯 **Goals**: Track progress towards your calorie goals
- 🔄 **Synchronization**: Real-time sync with web application
- 🌙 **Dark Theme**: Elegant dark interface

### 💻 Web Application (Next.js)
- 📈 **Dashboards**: Extended charts and analytics
- 📋 **Management**: Full CRUD for nutrition data  
- 💻 **Responsive**: Full functionality on desktop and mobile
- 🔄 **Real-time**: GraphQL subscriptions for live updates
- 🎨 **Modern UI**: Tailwind CSS with dark theme

### 🚀 Backend (GraphQL + AI)
- 🤖 **OpenAI GPT-4 Vision**: Food image analysis
- 📊 **GraphQL API**: Modern API with subscriptions
- 🗄️ **MongoDB**: Scalable database
- 🔐 **JWT Auth**: Secure authentication
- 📡 **WebSocket**: Real-time communication

## 🛠️ Technology Stack

| Layer | Technologies |
|---------|-------------|
| **iOS** | SwiftUI, Combine, Core Data, URLSession |
| **Web** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Apollo GraphQL, MongoDB, JWT |
| **AI** | OpenAI GPT-4 Vision API |
| **Real-time** | GraphQL Subscriptions, WebSocket |
| **Styling** | Tailwind CSS, Framer Motion, SwiftUI |

## 🚀 Quick Start

### Option 1: Docker (Recommended) 🐳

```bash
# Clone repository
git clone <repository-url>
cd evoflowai

# Start with Docker Compose (uses MongoDB Atlas)
docker-compose up --build

# Or use local MongoDB
docker-compose -f docker-compose.local.yml up --build
```

**Access:**
- 🌐 Web App: http://localhost:3000
- 🔌 API: http://localhost:3001/graphql

See [DOCKER.md](DOCKER.md) for detailed Docker documentation.

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp backend/.env.example backend/.env
cp web/.env.local.example web/.env.local

# Build shared types
npm run build:shared

# Run development servers (in separate terminals)
cd backend && npm run dev
cd web && npm run dev
```

**More Documentation:**
- 📚 [Complete Setup Guide](docs/SETUP.md)

## 📊 Main GraphQL Operations

```graphql
# Analyze food image
mutation AnalyzeImage($input: AnalyzeImageInput!) {
  analyzeImage(input: $input) {
    nutrition { calories protein carbs fat }
    foodName
    suggestions
  }
}

# Get user statistics
query GetStats($input: StatsQueryInput!) {
  getStats(input: $input) {
    averageCalories
    trends { calories }
    goalAchievementRate
  }
}

# Chat with AI
mutation SendMessage($input: SendMessageInput!) {
  sendMessage(input: $input) {
    content
    role
    timestamp
  }
}
```

## 🎯 Roadmap

### ✅ Implemented
- [x] Monorepo structure with shared types
- [x] GraphQL API with Apollo Server
- [x] Next.js with dark theme and Tailwind CSS
- [x] SwiftUI with dark theme
- [x] Data models and GraphQL schema
- [x] UI components (cards, buttons, animations)
- [x] Apollo Client with subscriptions
- [x] JWT authentication system
- [x] User registration and login
- [x] Dashboard with stats and progress tracking
- [x] Docker deployment configuration
- [x] MongoDB Atlas integration

### 🚧 In Progress
- [ ] OpenAI Vision API integration
- [ ] Image upload and processing
- [ ] AI chat and recommendations
- [ ] Charts and statistics
- [ ] Core Data (iOS)
- [ ] Push notifications

### 🔮 Future Features
- [ ] Data export (PDF, CSV)
- [ ] Apple Health integration
- [ ] Offline mode
- [ ] Meal sharing
- [ ] AI meal planner
- [ ] Nutrition trend analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

**evoFlowAI** - Your intelligent journey to healthier nutrition! 🌟
