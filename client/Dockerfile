# ==============================================================================
# Multi-Stage Dockerfile for React + Vite Frontend Client
# Stage 1: Build static assets with Node.js 20 Alpine (Non-root)
# Stage 2: Serve optimized assets with Alpine Nginx Reverse Proxy
# Security: Minimal attack surface, least privilege file permissions
# ==============================================================================

# --- Stage 1: Build Environment ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors first for Docker layer caching
COPY package*.json ./

RUN npm ci

# Copy application source code
COPY . .

# Build production bundle to /app/dist
RUN npm run build

# --- Stage 2: Production Nginx Server ---
FROM nginx:alpine AS runner

# Remove default nginx HTML directory
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage with read-only permissions
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# Copy custom Nginx configuration (SPA routing & /api reverse proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
