# @sentry/expo-upload-sourcemaps patch

Adds `--dist $SENTRY_DIST` to the `sentry-cli sourcemaps upload` call, when the
env var is set. Symbolication matches on debug IDs so this isn't strictly
required, but it keeps OTA sourcemap artifacts associated with the commit hash
(`dist`) in the Sentry UI, matching the runtime `dist` set in
`src/logger/sentry/setup/index.ts`.
