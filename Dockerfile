# One container: PocketBase serves the API, runs the migrations/hooks, and serves the built frontend.
# Data lives in /pb/pb_data: mount a persistent volume there (Dokploy: Volumes > /pb/pb_data).

# --- frontend ---------------------------------------------------------------
FROM node:22-alpine AS web
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npx vite build --outDir /app/pb_public --emptyOutDir

# --- pocketbase -------------------------------------------------------------
FROM alpine:3.20
ARG PB_VERSION=0.40.6
ARG TARGETARCH=amd64
RUN apk add --no-cache ca-certificates tzdata wget unzip \
  && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" -O /tmp/pb.zip \
  && unzip -q /tmp/pb.zip pocketbase -d /pb \
  && rm /tmp/pb.zip \
  && apk del wget unzip

WORKDIR /pb
COPY backend/pb_migrations ./pb_migrations
COPY backend/pb_hooks ./pb_hooks
COPY --from=web /app/pb_public ./pb_public

EXPOSE 8090
VOLUME /pb/pb_data

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8090/api/health || exit 1

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--hooksDir=/pb/pb_hooks", "--hooksWatch=false", "--migrationsDir=/pb/pb_migrations", "--publicDir=/pb/pb_public"]
