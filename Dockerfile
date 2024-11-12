FROM golang:1.22-bullseye AS build-env

WORKDIR /usr/src/social-app

ENV DEBIAN_FRONTEND=noninteractive

# Node
ENV NODE_VERSION=20
ENV NVM_DIR=/usr/share/nvm

# Go
ENV GODEBUG="netdns=go"
ENV GOOS="linux"
ENV GOARCH="amd64"
ENV CGO_ENABLED=1
ENV GOEXPERIMENT="loopvar"

# Expo
ARG EXPO_PUBLIC_BUNDLE_IDENTIFIER
ENV EXPO_PUBLIC_BUNDLE_IDENTIFIER=${EXPO_PUBLIC_BUNDLE_IDENTIFIER:-dev}

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
  yarn intl:build && \
  EXPO_PUBLIC_BUNDLE_IDENTIFIER=$EXPO_PUBLIC_BUNDLE_IDENTIFIER EXPO_PUBLIC_BUNDLE_DATE=$() yarn build-web

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
