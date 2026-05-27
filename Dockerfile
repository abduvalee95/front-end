# Build:  docker build -t bilim-front .
# Run:    docker run -p 3000:3000 -e API_URL=https://your-backend.example.com bilim-front
# Secrets must be injected at runtime via -e flags or a secrets manager — never bake them in.

# ─── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:24-alpine AS deps

# libc6-compat is required for native bindings (swc, sharp) on musl/Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# ─── Stage 2: Build the application ─────────────────────────────────────────
FROM node:24-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build produces .next/standalone/ via output:'standalone' in next.config.ts
RUN npm run build

# ─── Stage 3: Production runtime ─────────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user (UID/GID 1001 matches Next.js convention)
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy the standalone server bundle
COPY --from=builder /app/.next/standalone ./

# Copy static assets (standalone doesn't bundle these)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# server.js is the standalone entry point emitted by Next.js
CMD ["node", "server.js"]
