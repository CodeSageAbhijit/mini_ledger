# Multi-stage Dockerfile for MiniLedger API

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/tsconfig*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

RUN npm ci

# Copy source files
COPY packages/shared/src ./packages/shared/src
COPY apps/api/src ./apps/api/src

# Generate Prisma Client & Build TypeScript
RUN npx --workspace=@miniledger/api prisma generate
RUN npm run build:shared
RUN npm run --workspace=@miniledger/api build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install openssl for Prisma runtime
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production dependencies & built artifacts
COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup apps/api/package*.json ./apps/api/
COPY --chown=appuser:appgroup packages/shared/package*.json ./packages/shared/
COPY --chown=appuser:appgroup --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --chown=appuser:appgroup --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=appuser:appgroup --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Create uploads directory with appropriate permissions
RUN mkdir -p /app/apps/api/uploads && chown -R appuser:appgroup /app/apps/api/uploads

USER appuser

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
