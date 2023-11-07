import format from 'date-fns/format'
import {nanoid} from 'nanoid/non-secure'

import {Sentry} from '#/logger/sentry'
import * as env from '#/env'
import {DebugContext} from '#/logger/debugContext'
import {add} from '#/logger/logDump'

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Log = 'log',
  Warn = 'warn',
  Error = 'error',
}

type Transport = (
  level: LogLevel,
  message: string | Error,
  metadata: Metadata,
  timestamp: number,
) => void

/**
 * A union of some of Sentry's breadcrumb properties as well as Sentry's
 * `captureException` parameter, `CaptureContext`.
 */
type Metadata = {
  /**
   * Applied as Sentry breadcrumb types. Defaults to `default`.
   *
   * @see https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/#breadcrumb-types
   */
  type?:
    | 'default'
    | 'debug'
    | 'error'
    | 'navigation'
    | 'http'
    | 'info'
    | 'query'
    | 'transaction'
    | 'ui'
    | 'user'

  /**
   * Passed through to `Sentry.captureException`
   *
   * @see https://github.com/getsentry/sentry-javascript/blob/903addf9a1a1534a6cb2ba3143654b918a86f6dd/packages/types/src/misc.ts#L65
   */
  tags?: {
    [key: string]:
      | number
      | string
      | boolean
      | bigint
      | symbol
      | null
      | undefined
  }

  /**
   * Any additional data, passed through to Sentry as `extra` param on
   * exceptions, or the `data` param on breadcrumbs.
   */
  [key: string]: unknown
} & Parameters<typeof Sentry.captureException>[1]

export type ConsoleTransportEntry = {
  id: string
  timestamp: number
  level: LogLevel
  message: string | Error
  metadata: Metadata
}

const enabledLogLevels: {
  [key in LogLevel]: LogLevel[]
} = {
  [LogLevel.Debug]: [
    LogLevel.Debug,
    LogLevel.Info,
    LogLevel.Log,
    LogLevel.Warn,
    LogLevel.Error,
  ],
  [LogLevel.Info]: [LogLevel.Info, LogLevel.Log, LogLevel.Warn, LogLevel.Error],
  [LogLevel.Log]: [LogLevel.Log, LogLevel.Warn, LogLevel.Error],
  [LogLevel.Warn]: [LogLevel.Warn, LogLevel.Error],
  [LogLevel.Error]: [LogLevel.Error],
}

/**
 * Used in dev mode to nicely log to the console
 */
export const consoleTransport: Transport = (
  level,
  message,
  metadata,
  timestamp,
) => {
  const extra = Object.keys(metadata).length
    ? ' ' + JSON.stringify(metadata, null, '  ')
    : ''
  const log = {
    [LogLevel.Debug]: console.debug,
    [LogLevel.Info]: console.info,
    [LogLevel.Log]: console.log,
    [LogLevel.Warn]: console.warn,
    [LogLevel.Error]: console.error,
  }[level]

  log(`${format(timestamp, 'HH:mm:ss')} ${message.toString()}${extra}`)
}

export const sentryTransport: Transport = (
  level,
  message,
  {type, tags, ...metadata},
  timestamp,
) => {
  /**
   * If a string, report a breadcrumb
   */
  if (typeof message === 'string') {
    const severity = (
      {
        [LogLevel.Debug]: 'debug',
        [LogLevel.Info]: 'info',
        [LogLevel.Log]: 'log', // Sentry value here is undefined
        [LogLevel.Warn]: 'warning',
        [LogLevel.Error]: 'error',
      } as const
    )[level]

    Sentry.addBreadcrumb({
      message,
      data: metadata,
      type: type || 'default',
      level: severity,
      timestamp: timestamp / 1000, // Sentry expects seconds
    })

    /**
     * Send all higher levels with `captureMessage`, with appropriate severity
     * level
     */
    if (level === 'error' || level === 'warn' || level === 'log') {
      const messageLevel = ({
        [LogLevel.Log]: 'log',
        [LogLevel.Warn]: 'warning',
        [LogLevel.Error]: 'error',
      }[level] || 'log') as Sentry.Breadcrumb['level']

      Sentry.captureMessage(message, {
        level: messageLevel,
        tags,
        extra: metadata,
      })
    }
  } else {
    /**
     * It's otherwise an Error and should be reported with captureException
     */
    Sentry.captureException(message, {
      tags,
      extra: metadata,
    })
  }
}

/**
 * Main class. Defaults are provided in the constructor so that subclasses are
 * technically possible, if we need to go that route in the future.
 */
export class Logger {
  LogLevel = LogLevel
  DebugContext = DebugContext

  enabled: boolean
  level: LogLevel
  transports: Transport[] = []

  protected debugContextRegexes: RegExp[] = []

  constructor({
    enabled = !env.IS_TEST,
    level = env.LOG_LEVEL as LogLevel,
    debug = env.LOG_DEBUG || '',
  }: {
    enabled?: boolean
    level?: LogLevel
    debug?: string
  } = {}) {
    this.enabled = enabled !== false
    this.level = debug ? LogLevel.Debug : level ?? LogLevel.Info // default to info
    this.debugContextRegexes = (debug || '').split(',').map(context => {
      return new RegExp(context.replace(/[^\w:*]/, '').replace(/\*/g, '.*'))
    })
  }

  debug(message: string, metadata: Metadata = {}, context?: string) {
    if (context && !this.debugContextRegexes.find(reg => reg.test(context)))
      return
    this.transport(LogLevel.Debug, message, metadata)
  }

  info(message: string, metadata: Metadata = {}) {
    this.transport(LogLevel.Info, message, metadata)
  }

  log(message: string, metadata: Metadata = {}) {
    this.transport(LogLevel.Log, message, metadata)
  }

  warn(message: string, metadata: Metadata = {}) {
    this.transport(LogLevel.Warn, message, metadata)
  }

  error(error: Error | string, metadata: Metadata = {}) {
    this.transport(LogLevel.Error, error, metadata)
  }

  addTransport(transport: Transport) {
    this.transports.push(transport)
    return () => {
      this.transports.splice(this.transports.indexOf(transport), 1)
    }
  }

  disable() {
    this.enabled = false
  }

  enable() {
    this.enabled = true
  }

  protected transport(
    level: LogLevel,
    message: string | Error,
    metadata: Metadata = {},
  ) {
    if (!this.enabled) return
    if (!enabledLogLevels[this.level].includes(level)) return

    const timestamp = Date.now()
    const meta = metadata || {}

    for (const transport of this.transports) {
      transport(level, message, meta, timestamp)
    }

    add({
      id: nanoid(),
      timestamp,
      level,
      message,
      metadata: meta,
    })
  }
}

/**
 * Logger instance. See `@/logger/README` for docs.
 *
 * Basic usage:
 *
 *   `logger.debug(message[, metadata, debugContext])`
 *   `logger.info(message[, metadata])`
 *   `logger.warn(message[, metadata])`
 *   `logger.error(error[, metadata])`
 *   `logger.disable()`
 *   `logger.enable()`
 */
export const logger = new Logger()

/**
 * Report to console in dev, Sentry in prod, nothing in test.
 */
if (env.IS_DEV && !env.IS_TEST) {
  logger.addTransport(consoleTransport)

  /**
   * Uncomment this to test Sentry in dev
   */
  // logger.addTransport(sentryTransport);
} else if (env.IS_PROD) {
  // logger.addTransport(sentryTransport)
}
