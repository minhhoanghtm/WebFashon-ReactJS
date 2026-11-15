# ==============================================================================
# REACT-WebFashion — Back-end Production Dockerfile
# Secure Non-root Node 22 Alpine Runtime
# ==============================================================================

FROM node:22-alpine AS runtime

# Install curl for healthcheck / network diagnostics
RUN apk add --no-cache curl

WORKDIR /app

# Ensure workspace and upload directory are owned by node user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Switch to non-root user for security
USER node

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Install dependencies as node user
COPY --chown=node:node package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy source code with non-root ownership
COPY --chown=node:node . .

# Expose backend API port
EXPOSE 5000

# Built-in healthcheck using native fetch (Node 18+)
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Direct node execution for proper POSIX signal handling (SIGTERM, SIGINT)
CMD ["node", "src/server.js"]
