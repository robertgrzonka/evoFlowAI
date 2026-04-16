# Scripts

This directory contains helper scripts for managing the evoFlowAI application.

## Available Scripts

### start.sh
Interactive script to quickly start the application.

**Usage:**
```bash
./scripts/start.sh
```

**Features:**
- Auto-detects if Docker is available
- Provides menu for choosing deployment method
- Checks for required files and dependencies
- Guides you through the setup process

## Manual Commands

### Using Makefile
```bash
# View all available commands
make help

# Install dependencies
make install

# Start with Docker
make docker-up

# Start development servers
make dev
```

### Direct Commands

**Docker:**
```bash
# With MongoDB Atlas
docker-compose up --build

# With local MongoDB
docker-compose -f docker-compose.local.yml up --build
```

**Local Development:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd web && npm run dev
```

