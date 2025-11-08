## Multi-stage build for project-service backend
## We need native ODBC libs for msnodesqlv8; Alpine (musl) causes build issues.
## Using Debian slim image provides glibc + apt to install unixODBC and build tools.

FROM node:20-bookworm-slim AS builder

ENV NODE_ENV=production
WORKDIR /app

# Install build dependencies for native modules (msnodesqlv8) and ODBC runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    python3 make g++ unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

# Install all deps (incl. dev) for building TypeScript
RUN npm ci

COPY . .

# Build TypeScript sources
RUN npm run build

FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Runtime dependency: unixODBC for msnodesqlv8
RUN apt-get update \
    && apt-get install -y --no-install-recommends unixodbc \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/package-lock.json ./

# Install only production deps at runtime
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["node", "./dist/index.js"]