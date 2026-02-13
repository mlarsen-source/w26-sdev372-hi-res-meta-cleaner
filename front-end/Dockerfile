# Multi-stage Dockerfile for the Next.js frontend.
# Build args (like NEXT_PUBLIC_API_URL) are passed from docker-compose.yml,
# which reads them from the root .env file.

# ── Stage 1: Install dependencies ────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build the Next.js application ───────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Next.js bakes NEXT_PUBLIC_* env vars into the bundle at build time,
# so this must be provided as a build arg, not a runtime env var.
# Value is supplied by docker-compose.yml from the .env file.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_LOCAL_SYSVAR=${NEXT_PUBLIC_API_URL}

# Ensure public directory exists even if empty
RUN mkdir -p /app/public

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: Production runner ───────────────────────────────────────
# Uses Next.js standalone output — a self-contained server that does
# NOT require node_modules, keeping the final image small.
FROM node:20-alpine AS runner
WORKDIR /app

# Run as non-root for security
RUN addgroup -S app && adduser -S app -G app

# Copy the standalone server bundle (includes its own node_modules subset)
COPY --from=builder /app/.next/standalone ./

# Standalone excludes these — copy static assets and public files manually
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN chown -R app:app /app
USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
	CMD wget -qO- http://127.0.0.1:${PORT}/ || exit 1

# Standalone output produces its own server.js entry point
CMD ["node", "server.js"]
