FROM golang:1.23-bullseye AS build-env

WORKDIR /usr/src/social-app

ENV DEBIAN_FRONTEND=noninteractive

#
# Node
#
ENV NODE_VERSION=20
ENV NVM_DIR=/usr/share/nvm

#
# Go
#
ENV GODEBUG="netdns=go"
ENV GOOS="linux"
ENV GOARCH="amd64"
ENV CGO_ENABLED=1
ENV GOEXPERIMENT="loopvar"

#
# Expo
#
ARG EXPO_PUBLIC_BUNDLE_IDENTIFIER
ENV EXPO_PUBLIC_BUNDLE_IDENTIFIER=${EXPO_PUBLIC_BUNDLE_IDENTIFIER:-dev}

# The latest git hash of the preview branch on render.com
ARG RENDER_GIT_COMMIT

#
# Sentry
#
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN:-unknown}
# Will fall back to package.json#version, but this is handled elsewhere
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE
ARG SENTRY_DIST
# Default to RENDER_GIT_COMMIT if not set by GitHub workflows
ENV SENTRY_DIST=${SENTRY_DIST:-$RENDER_GIT_COMMIT}
ARG SENTRY_DSN
ENV SENTRY_DSN=$SENTRY_DSN

#
# Copy everything into the container
#
COPY . .

#
# Generate the JavaScript webpack.
#
RUN mkdir --parents $NVM_DIR && \
  wget \
    --output-document=/tmp/nvm-install.sh \
    https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh && \
  bash /tmp/nvm-install.sh

RUN \. "$NVM_DIR/nvm.sh" && \
  nvm install $NODE_VERSION && \
  nvm use $NODE_VERSION && \
  echo "Using bundle identifier: $EXPO_PUBLIC_BUNDLE_IDENTIFIER" && \
  echo "EXPO_PUBLIC_BUNDLE_IDENTIFIER=$EXPO_PUBLIC_BUNDLE_IDENTIFIER" >> .env && \
  echo "EXPO_PUBLIC_BUNDLE_DATE=$(date -u +"%y%m%d%H")" >> .env && \
  npm install --global yarn && \
  yarn && \
  yarn intl:build 2>&1 | tee i18n.log && \
  if grep -q "invalid syntax" "i18n.log"; then echo "\n\nFound compilation errors!\n\n" && exit 1; else echo "\n\nNo compile errors!\n\n"; fi && \
  EXPO_PUBLIC_BUNDLE_IDENTIFIER=$EXPO_PUBLIC_BUNDLE_IDENTIFIER EXPO_PUBLIC_BUNDLE_DATE=$() SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN SENTRY_RELEASE=$SENTRY_RELEASE SENTRY_DIST=$SENTRY_DIST SENTRY_DSN=$SENTRY_DSN yarn build-web

# DEBUG
RUN find ./bskyweb/static && find ./web-build/static

#
# Generate the bskyweb Go binary.
#
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

FROM debian:bullseye-slim

ENV GODEBUG=netdns=go
ENV TZ=Etc/UTC
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install --yes \
  dumb-init \
  ca-certificates

ENTRYPOINT ["dumb-init", "--"]

WORKDIR /bskyweb
COPY --from=build-env /bskyweb /usr/bin/bskyweb

CMD ["/usr/bin/bskyweb"]

LABEL org.opencontainers.image.source=https://github.com/bluesky-social/social-app
LABEL org.opencontainers.image.description="bsky.app Web App"
LABEL org.opencontainers.image.licenses=MIT

# NOOP
