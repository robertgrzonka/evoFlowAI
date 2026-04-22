# evoFlowAI - Multi-stage Docker build

# Stage 1: Build shared types
FROM node:18-alpine AS shared-builder
WORKDIR /app/shared
COPY shared/package*.json ./
RUN npm install
COPY shared/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY --from=shared-builder /app/shared /app/shared
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Stage 3: Build web
FROM node:18-alpine AS web-builder
WORKDIR /app
COPY --from=shared-builder /app/shared /app/shared
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web/ ./
# Next.js may have no tracked `public/`; Docker COPY requires the path to exist
RUN mkdir -p public
RUN npm run build

# Stage 4: Production backend
# Layout must match backend/package.json: "@evoflowai/shared": "file:../shared"
FROM node:18-alpine AS backend-production
RUN apk add --no-cache wget

COPY --from=shared-builder /app/shared /app/shared
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/package.json /app/backend/

WORKDIR /app/backend
RUN npm install --only=production
RUN mkdir -p uploads

EXPOSE 3001
# Ensure cwd is backend (uploads, dotenv, relative paths); Railway may not preserve WORKDIR for custom start
CMD ["sh", "-c", "cd /app/backend && exec node dist/server.js"]

# Stage 5: Production web
FROM node:18-alpine AS web-production
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built files
COPY --from=web-builder /app/web/.next ./.next
COPY --from=web-builder /app/web/package*.json ./
COPY --from=web-builder /app/web/public ./public
COPY --from=web-builder /app/web/next.config.js ./
COPY --from=shared-builder /app/shared /app/shared

# Install production dependencies only
RUN npm install --only=production

EXPOSE 3000

CMD ["npm", "start"]
