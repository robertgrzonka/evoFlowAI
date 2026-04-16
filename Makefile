# evoFlowAI - Makefile for easy commands
# Run: make <command>

.PHONY: help install build dev dev-backend dev-web docker-up docker-down docker-logs docker-clean

help: ## Show this help message
	@echo "evoFlowAI - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	npm install
	cd backend && npm install
	cd web && npm install
	cd shared && npm install

build: ## Build all packages
	npm run build

dev: ## Run all services in development mode
	npm run dev

dev-backend: ## Run only backend in development mode
	cd backend && npm run dev

dev-web: ## Run only web in development mode
	cd web && npm run dev

# Docker commands
docker-up: ## Start Docker containers (MongoDB Atlas)
	docker-compose up --build

docker-up-local: ## Start Docker containers with local MongoDB
	docker-compose -f docker-compose.local.yml up --build

docker-down: ## Stop Docker containers
	docker-compose down

docker-down-local: ## Stop Docker containers (local MongoDB)
	docker-compose -f docker-compose.local.yml down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-logs-backend: ## View backend logs
	docker-compose logs -f backend

docker-logs-web: ## View web logs
	docker-compose logs -f web

docker-clean: ## Remove all Docker containers, images and volumes
	docker-compose down -v
	docker system prune -af

docker-restart: ## Restart Docker containers
	docker-compose restart

docker-rebuild: ## Rebuild and restart Docker containers
	docker-compose up --build --force-recreate

# Testing
test: ## Run all tests
	npm test

test-backend: ## Run backend tests
	cd backend && npm test

test-web: ## Run web tests
	cd web && npm test

# Linting
lint: ## Run linter
	npm run lint

lint-fix: ## Fix linting issues
	npm run lint:fix

# Database
db-seed: ## Seed database with sample data (not implemented yet)
	@echo "Database seeding not implemented yet"

# Clean
clean: ## Remove node_modules and build artifacts
	rm -rf node_modules
	rm -rf backend/node_modules backend/dist
	rm -rf web/node_modules web/.next
	rm -rf shared/node_modules shared/dist

# Production
prod-backend: ## Run backend in production mode
	cd backend && npm start

prod-web: ## Run web in production mode
	cd web && npm start

