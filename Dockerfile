# ─── Stage 1: Builder ────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (layer cache optimization)
COPY package*.json ./

# Install all dependencies (including devDeps for potential build steps)
RUN npm ci --only=production && npm cache clean --force

# ─── Stage 2: Production ──────────────────────────────────────────────
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

WORKDIR /app

# Copy installed node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY --chown=nodeuser:nodejs . .

# Switch to non-root user
USER nodeuser

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start server with dumb-init for proper process management
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
