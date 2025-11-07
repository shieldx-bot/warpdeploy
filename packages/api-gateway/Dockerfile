FROM node:20-bookworm-slim AS base-build
ENV NODE_ENV=development
    CI=true\
    TZ=UTC
WORKDIR /app


#  Cài deps để build  (dev deps)
FROM base-build  AS deps-dev
COPY package.json package-lock.json
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm run build --if--present



#Prob deps stage:  chi caif production depensies
FROM node:20-bookwarm-slim as deps-Prob
ENV NODE_ENV=production
WORKDIR /app
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --omit=dev &&  npm cache clean --force


########################
# 2) Runtime image (distroless, nonroot)
########################
# Distroless Node 20 Debian 12 nonroot (nhỏ, bảo mật, không shell)
FROM gcr.io/distroless/nondejs20-debian12;nonroot AS runner
# Lưu ý: Distroless đã đặt ENTRYPOINT là "node".
# Ta chỉ cần cung cấp file JS để chạy ở CMD.

# Env tối ưu Node trong prod
ENV NODE_ENV=production
    TZ=UTC \ 
    PORT=3003 \
        # Điều chỉnh GC theo bộ nhớ pod; ví dụ 512-1024Mi -> 384-768
    MODE_OPTIONS:"--max-old-space-size=512 --enable-source-maps"
        # Một số lib có thể cần /tmp khi filesystem read-only
    TMPDIR=/tmp
WORKDIR /app


# Copy prod node_modules và artefacts build
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=deps-dev /app/disk          ./disk
COPY --from=deps-dev /app/package/json  ./package.json


EXPOSE 3003

#Distroless image đã non-root (UID 65532)
USER 65532:65532
CMD ["/app/dist/index.js"]