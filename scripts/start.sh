#!/bin/bash

# evoFlowAI - Quick Start Script
# This script helps you start the application quickly

set -e

echo "🚀 evoFlowAI - Quick Start"
echo "=========================="
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✅ Docker is available"
    echo ""
    echo "Choose deployment method:"
    echo "  1) Docker with MongoDB Atlas (recommended)"
    echo "  2) Docker with local MongoDB"
    echo "  3) Local development (Node.js)"
    echo "  4) Exit"
    echo ""
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            echo ""
            echo "🐳 Starting with Docker + MongoDB Atlas..."
            if [ ! -f ".env.docker" ]; then
                echo "⚠️  Warning: .env.docker not found. Using default configuration."
            fi
            docker-compose up --build
            ;;
        2)
            echo ""
            echo "🐳 Starting with Docker + Local MongoDB..."
            docker-compose -f docker-compose.local.yml up --build
            ;;
        3)
            echo ""
            echo "💻 Starting local development..."
            
            # Check if dependencies are installed
            if [ ! -d "node_modules" ]; then
                echo "📦 Installing dependencies..."
                npm install
            fi
            
            # Check if shared is built
            if [ ! -d "shared/dist" ]; then
                echo "🔨 Building shared types..."
                npm run build:shared
            fi
            
            # Check environment files
            if [ ! -f "backend/.env" ]; then
                echo "⚠️  backend/.env not found. Copying from example..."
                cp backend/.env.example backend/.env || true
            fi
            
            if [ ! -f "web/.env.local" ]; then
                echo "⚠️  web/.env.local not found. Copying from example..."
                cp web/.env.local.example web/.env.local || true
            fi
            
            echo ""
            echo "🎯 Starting services..."
            echo "   Backend: http://localhost:3001"
            echo "   Frontend: http://localhost:3000"
            echo ""
            echo "⚠️  You need to run these in separate terminals:"
            echo "   Terminal 1: cd backend && npm run dev"
            echo "   Terminal 2: cd web && npm run dev"
            echo ""
            ;;
        4)
            echo "Goodbye! 👋"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
else
    echo "⚠️  Docker not found or not running"
    echo ""
    echo "💻 Starting local development mode..."
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    # Check if shared is built
    if [ ! -d "shared/dist" ]; then
        echo "🔨 Building shared types..."
        npm run build:shared
    fi
    
    echo ""
    echo "⚠️  You need to run these in separate terminals:"
    echo "   Terminal 1: cd backend && npm run dev"
    echo "   Terminal 2: cd web && npm run dev"
    echo ""
fi

