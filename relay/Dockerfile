# Build from the repository root: docker build -f relay/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app/relay
RUN corepack enable
COPY relay/package.json relay/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts \
  && ln -s /app/relay/node_modules /app/node_modules
COPY src/features/liveStream/lib /app/src/features/liveStream/lib
COPY relay/tsconfig.json ./
COPY relay/src ./src
RUN pnpm build

FROM node:22-alpine
RUN apk add --no-cache ffmpeg
ENV NODE_ENV=production \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    PORT=8080
WORKDIR /app
COPY --from=build /app/relay/dist/main.js ./main.js
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz > /dev/null || exit 1
CMD ["node", "main.js"]
