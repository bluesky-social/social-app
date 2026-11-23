# Build context is the repo root: `docker build -f services/embed/Dockerfile .`
#
# Stage 1: build the embed bundle and copy it into services/web, where the
# embedr Go server (services/web/cmd/embedr) embeds it.
#
FROM node:24.22-bookworm-slim AS web-build

# Tells pnpm to run non-interactively (needed for install/script steps)
ENV CI=true

WORKDIR /repo

RUN npm install --global pnpm@12.16.1

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/embed ./services/embed
COPY services/web ./services/web
COPY scripts/post-embed-build.js ./scripts/post-embed-build.js

# Build inside a `pnpm deploy` copy that has only bskyembed's declared
# dependencies. See services/link/Dockerfile for the flags.
RUN pnpm --filter bskyembed deploy \
  --config.inject-workspace-packages=true \
  --config.allow-unused-patches=true \
  /build
RUN cd /build && \
  pnpm build && \
  pnpm build-snippet && \
  cp -r /build/dist /repo/services/embed/dist && \
  node /repo/scripts/post-embed-build.js

#
# Stage 2: build the embedr Go binary, embedding the assets from stage 1.
#
FROM golang:1.26.10-bookworm AS go-build

WORKDIR /usr/src/social-app

ENV GODEBUG="netdns=go"
ENV GOOS="linux"
ARG TARGETARCH
ENV GOARCH=${TARGETARCH:-amd64}
ENV CGO_ENABLED=1
ENV GOEXPERIMENT="loopvar"

COPY --from=web-build /repo/services/web ./services/web

# hack around issue with empty directory and go:embed
RUN touch \
  services/web/static/js/empty.txt \
  services/web/static/css/empty.txt \
  services/web/static/media/empty.txt

RUN cd services/web/ && \
  go mod download && \
  go mod verify

RUN cd services/web/ && \
  go build \
    -v  \
    -trimpath \
    -tags timetzdata \
    -o /embedr \
    ./cmd/embedr

#
# Stage 3: runtime image.
#
FROM debian:bookworm-slim

ENV GODEBUG=netdns=go
ENV TZ=Etc/UTC
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install --yes \
  dumb-init \
  ca-certificates

ENTRYPOINT ["dumb-init", "--"]

WORKDIR /embedr
COPY --from=go-build /embedr /usr/bin/embedr

CMD ["/usr/bin/embedr"]

LABEL org.opencontainers.image.source=https://github.com/bluesky-social/social-app
LABEL org.opencontainers.image.description="embed.bsky.app Web App"
LABEL org.opencontainers.image.licenses=MIT
