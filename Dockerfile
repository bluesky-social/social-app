#
# Stage 1: build the web bundle with pnpm.
#
# Uses the official pnpm image. Node is auto-downloaded by pnpm using the
# `devEngines.runtime` field in package.json (onFail: "download").
#
FROM ghcr.io/pnpm/pnpm:11 AS web-build

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

#
# pnpm config
#
ENV CI=1
# use the pnpm version specified in package.json
ENV pnpm_config_pm_on_fail=download

# The latest git hash of the preview branch on render.com
# https://render.com/docs/docker-secrets#environment-variables-in-docker-builds
ARG RENDER_GIT_COMMIT

#
# Expo
#
ARG EXPO_PUBLIC_ENV
ENV EXPO_PUBLIC_ENV=${EXPO_PUBLIC_ENV:-development}
ARG EXPO_PUBLIC_RELEASE_VERSION
ENV EXPO_PUBLIC_RELEASE_VERSION=$EXPO_PUBLIC_RELEASE_VERSION
ARG EXPO_PUBLIC_BUNDLE_IDENTIFIER
# If not set by GitHub workflows, we're probably in Render
ENV EXPO_PUBLIC_BUNDLE_IDENTIFIER=${EXPO_PUBLIC_BUNDLE_IDENTIFIER:-$RENDER_GIT_COMMIT}

#
# Sentry
#
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN:-unknown}
ARG EXPO_PUBLIC_SENTRY_DSN
ENV EXPO_PUBLIC_SENTRY_DSN=$EXPO_PUBLIC_SENTRY_DSN

COPY . .

RUN echo "Using bundle identifier: $EXPO_PUBLIC_BUNDLE_IDENTIFIER" && \
  echo "EXPO_PUBLIC_ENV=$EXPO_PUBLIC_ENV" >> .env && \
  echo "EXPO_PUBLIC_RELEASE_VERSION=$EXPO_PUBLIC_RELEASE_VERSION" >> .env && \
  echo "EXPO_PUBLIC_BUNDLE_IDENTIFIER=$EXPO_PUBLIC_BUNDLE_IDENTIFIER" >> .env && \
  echo "EXPO_PUBLIC_BUNDLE_DATE=$(date -u +"%y%m%d%H")" >> .env && \
  echo "EXPO_PUBLIC_SENTRY_DSN=$EXPO_PUBLIC_SENTRY_DSN" >> .env

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN pnpm intl:build 2>&1 | tee i18n.log && \
  if grep -q "invalid syntax" "i18n.log"; then echo "\n\nFound compilation errors!\n\n" && exit 1; else echo "\n\nNo compile errors!\n\n"; fi

RUN SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    SENTRY_RELEASE=$EXPO_PUBLIC_RELEASE_VERSION \
    SENTRY_DIST=$EXPO_PUBLIC_BUNDLE_IDENTIFIER \
    pnpm build-web

#
# Stage 2: build the bskyweb Go binary, embedding the assets from stage 1.
#
# post-web-build.js (run by `pnpm build-web`) writes the bundled JS/CSS/media
# into bskyweb/static/* and regenerates bskyweb/templates/scripts.html, so
# copying the bskyweb/ tree from stage 1 is enough for go:embed to find
# everything.
#
FROM golang:1.26-bookworm AS go-build

WORKDIR /usr/src/social-app

ENV GODEBUG="netdns=go"
ENV GOOS="linux"
ENV GOARCH="amd64"
ENV CGO_ENABLED=1
ENV GOEXPERIMENT="loopvar"

COPY --from=web-build /app/bskyweb ./bskyweb

# DEBUG
RUN find ./bskyweb/static

RUN cd bskyweb/ && \
  go mod download && \
  go mod verify

RUN cd bskyweb/ && \
  go build \
    -v  \
    -trimpath \
    -tags timetzdata \
    -o /bskyweb \
    ./cmd/bskyweb

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

WORKDIR /bskyweb
COPY --from=go-build /bskyweb /usr/bin/bskyweb

CMD ["/usr/bin/bskyweb"]

LABEL org.opencontainers.image.source=https://github.com/bluesky-social/social-app
LABEL org.opencontainers.image.description="bsky.app Web App"
LABEL org.opencontainers.image.licenses=MIT

# NOOP
