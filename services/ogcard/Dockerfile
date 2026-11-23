# Build context is the repo root: `docker build -f services/ogcard/Dockerfile .`
FROM node:24.22-alpine3.23 AS build

# Tells pnpm to run non-interactively (needed for install/script steps)
ENV CI=true

WORKDIR /repo

RUN npm install --global pnpm@12.16.1

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/ogcard ./services/ogcard

# `pnpm deploy` copies the service into a new directory and installs only its
# declared dependencies there, at the versions in the workspace lockfile.
# Building inside that copy means an undeclared import fails the build instead
# of resolving against the app's hoisted node_modules.
# - inject-workspace-packages: plain (non-legacy) deploy requires it. Legacy
#   deploy re-resolves some packages instead of using the lockfile's versions.
# - allow-unused-patches: the root patches are for the app.
ENV DEPLOY_FLAGS="--config.inject-workspace-packages=true --config.allow-unused-patches=true"
RUN pnpm --filter bskyogcard deploy $DEPLOY_FLAGS /build
RUN cd /build && pnpm install-fonts && pnpm build

# A second, production-only deploy for the runtime image. dist/ is gitignored,
# so deploy leaves it out and it's copied over from the build.
RUN pnpm --filter bskyogcard deploy --prod $DEPLOY_FLAGS /app && \
  cp -r /build/dist /app/dist

# Uses assets from build stage to reduce build size
FROM node:24.22-alpine3.23

RUN apk add --update dumb-init

# Avoid zombie processes, handle signal forwarding
ENTRYPOINT ["dumb-init", "--"]

WORKDIR /app
COPY --from=build /app /app
RUN mkdir /app/data && chown node /app/data

VOLUME /app/data
EXPOSE 3000 3001
ENV CARD_PORT=3000
ENV CARD_METRICS_PORT=3001
ENV NODE_ENV=production
ENV NODE_OPTIONS="--import=@atproto-labs/fetch-node/emudhra-preload"

# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#non-root-user
USER node
CMD ["node", "--heapsnapshot-signal=SIGUSR2", "--enable-source-maps", "dist/bin.js"]

LABEL org.opencontainers.image.source=https://github.com/bluesky-social/social-app
LABEL org.opencontainers.image.description="Bsky Card Service"
LABEL org.opencontainers.image.licenses=UNLICENSED
