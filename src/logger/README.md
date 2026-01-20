# Logging & Metrics

## Logging

```typescript
import { logger, Logger } from '#/logger'

// or, optionally create new instance with custom context
// const logger = Logger.create(Logger.Context.Notifications)

// for dev-only logs
logger.debug(message, {})

// for production breadcrumbs
logger.info(message, {})

// seldom used, prefer `info`
logger.log(message, {})

// for non-error issues to look into, seldom used, prefer `error`
logger.warn(message, {})

// for known errors without an exception, use a string
logger.error(`known error`, {})

// for unknown exceptions
try {
} catch (e) {
  logger.error(e, {message: `explain error`}])
}
```

#### Log Levels

Log level defaults to `info`. You can set this via the `EXPO_PUBLIC_LOG_LEVEL`
env var in `.env.local`.

#### Filtering debugs by context

Debug logs are dev-only, and not enabled by default. Once enabled, they can get
noisy. So you can filter them by setting the `EXPO_PUBLIC_LOG_DEBUG` env var
e.g. `EXPO_PUBLIC_LOG_DEBUG=notifications`. These values can be comma-separated
and include wildcards.

## Metrics

Metrics are emit using `logger.metric(event, payload)`.

## Metadata

We've implemented a shared metadata cache, which is used by the logger and by
our feature-flagging system, GrowthBook.

## Initialization

We manage our own device and session IDs, which are initialized at app startup
via `await setupDeviceId`.
