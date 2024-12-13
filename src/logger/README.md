# Logger

Simple logger for Bluesky. Supports log levels, debug contexts, and separate
transports for production, dev, and test mode.

## At a Glance

```typescript
import { logger } from '#/logger'

logger.debug(message[, metadata, debugContext])
logger.info(message[, metadata])
logger.log(message[, metadata])
logger.warn(message[, metadata])
logger.error(error[, metadata])
```

#### Modes

The "modes" referred to here are inferred from `process.env.NODE_ENV`,
which matches how React Native sets the `__DEV__` global.

#### Log Levels

Log levels are used to filter which logs are either printed to the console
and/or sent to Sentry and other reporting services. To configure, set the
`EXPO_PUBLIC_LOG_LEVEL` environment variable in `.env` to one of `debug`,
`info`, `log`, `warn`, or `error`.

This variable should be `info` in production, and `debug` in dev. If it gets too
noisy in dev, simply set it to a higher level, such as `warn`.

## Usage

```typescript
import { logger } from '#/logger';
```

### `logger.error`

The `error` level is for... well, errors. These are sent to Sentry in production mode.

`error`, along with all log levels, supports an additional parameter, `metadata: Record<string, unknown>`. Use this to provide values to the [Sentry
breadcrumb](https://docs.sentry.io/platforms/react-native/enriching-events/breadcrumbs/#manual-breadcrumbs).

```typescript
try {
  // some async code
} catch (e) {
  logger.error(e, { ...metadata });
}
```

### `logger.warn`

Warnings will be sent to Sentry as a separate Issue with level `warning`, as
well as as breadcrumbs, with a severity level of `warning`

### `logger.log`

Logs with level `log` will be sent to Sentry as a separate Issue with level `log`, as
well as as breadcrumbs, with a severity level of `default`.

### `logger.info`

The `info` level should be used for information that would be helpful in a
tracing context, like Sentry. In production mode, `info` logs are sent
to Sentry as breadcrumbs, which decorate log levels above `info` such as `log`,
`warn`, and `error`.

### `logger.debug`

Debug level is really only intended for local development. Use this instead of
`console.log`.

```typescript
logger.debug(message, { ...metadata });
```

Inspired by [debug](https://www.npmjs.com/package/debug), when writing debug
logs, you can optionally pass a _context_, which can be then filtered when in
debug mode.

This value should be related to the feature, component, or screen
the code is running within, and **it should be defined in `#/logger/debugContext`**.
This way we know if a relevant context already exists, and we can trace all
active contexts in use in our app. This const enum is conveniently available on
the `logger` at `logger.DebugContext`.

For example, a debug log like this:

```typescript
logger.debug(message, {}, logger.DebugContext.composer);
```

Would be logged to the console in dev mode if `EXPO_PUBLIC_LOG_LEVEL=debug`, _or_ if you
pass a separate environment variable `LOG_DEBUG=composer`. This variable supports
multiple contexts using commas like `LOG_DEBUG=composer,profile`, and _automatically
sets the log level to `debug`, regardless of `EXPO_PUBLIC_LOG_LEVEL`._
