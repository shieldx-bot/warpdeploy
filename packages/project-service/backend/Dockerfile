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

# Clean reproducible install (production only)
RUN npm ci --omit=dev

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
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["node", "./dist/index.js"]