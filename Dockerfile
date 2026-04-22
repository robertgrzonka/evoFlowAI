# evoFlowAI - Multi-stage Docker build
#
# NOTE: The final stage must match the service you deploy when the host does not
# pass `docker build --target` (e.g. default Railway Docker build = last stage only).

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

# Stage 4: Production web (not the default final image — see backend-production below)
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

# Stage 5: Production backend — LAST stage: default `docker build .` / Railway without --target
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

CMD ["node", "dist/server.js"]
