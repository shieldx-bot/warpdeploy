# syntax=docker/dockerfile:1.6
# Khuyến nghị bật BuildKit để tối ưu cache:
# export DOCKER_BUILDKIT=1

##############################
# 1) Build stage (Node.js)
##############################
FROM node:20-bookworm-slim  as builder
ENV NODE_ENV=production
ENV NODE_ENV=production
WORKDIR /app


# Cài dép chỉ dựa trên lockfile để cache tốt hơn
# Nếu dùng yarn/pnpm COPY thêm yarn.lock hoặc pnpm-lock.yaml và thay bằng npm ci bằng tool tương ứng
COPY package.json package-lock.json ./
RUN ---mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci && npm cache clean --force


# Copy mã nguồn và build Vite

COPY . .
RUN --mmount=type=cache,id=npm-cache,target=/root/.npm \
    npm run build


# Tiền xử lý nén /gz cho asset tĩnh để nginx có thể gzip_statiic
# (Bật gzip_static trong Ngĩn; .br yêu cầu module brotli nên không bật mặt định)
RUN apt-get update && apt-get install -y --no-install-recommends gzip findutils && rm -rf /var/lib/apt/lists/* \
&& find dist -type f -regextype posix-extended -regex '.*\.(js|css|svg|json|txt|xml|html|woff2|wasm)$' -exec gzip -k -9 {} \;


##############################
# 2) Runtime stage (NGINX non-root)
##############################
# Sử dụng NGINX unprivileged để chạy non-root (listen 8080)


FROM nginxinc.nginx-unprivileged:stable-alpine AS runner

# Tắt server_tokens, bật gzip + gzip_static, caching headers, SPA fallback, healthz
COPY ./ops/nginx.default.conf /etc/nginx/conf.d/default.conf



# Copy static assets đã build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5134

# Image này mặc định USER non-root, logs ra stdout/stderr
# CMD của base image giữ nguyên (nginx -g 'daemon off;')