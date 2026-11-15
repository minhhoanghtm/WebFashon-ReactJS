# ==============================================================================
# REACT-WebFashion — Front-end Production Dockerfile
# Multi-stage: Node 22 Alpine Build -> Nginx Alpine High-Performance Runtime
# ==============================================================================

# ---------- Stage 1: Build ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source
COPY . .

# Build-time environment arguments
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

# Build production bundle with Vite
RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM nginx:stable-alpine AS runtime

# Copy custom Nginx configuration with gzip & caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Healthcheck to ensure Nginx is serving traffic
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/healthz || wget -q --spider http://127.0.0.1/ || exit 1

ENTRYPOINT ["nginx", "-g", "daemon off;"]
