# ==============================================================================
# Production Dockerfile for Backend API Server and Cron Worker
# Base: Node.js 20 Alpine for minimal attack surface and lightweight footprint
# Security: Non-root execution under unprivileged 'node' user
# ==============================================================================

FROM node:20-alpine AS base

# Install curl/wget for container healthchecks
RUN apk add --no-cache curl wget

WORKDIR /app

# Optimize Docker layer caching by copying dependency descriptors first
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy all application source code with ownership assigned to unprivileged 'node' user
COPY --chown=node:node . .

# Set default Node environment
ENV NODE_ENV=production

# Switch to unprivileged non-root user (Principle of Least Privilege)
USER node

# Expose default Express port
EXPOSE 5000

# Default command runs API server, but allows overrides (e.g. node worker.js in docker-compose)
CMD ["node", "server.js"]
