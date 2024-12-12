import format from 'date-fns/format'
import {nanoid} from 'nanoid/non-secure'

import {isNetworkError} from '#/lib/strings/errors'
import {DebugContext} from '#/logger/debugContext'
import {add} from '#/logger/logDump'
import {Sentry} from '#/logger/sentry'
import * as env from '#/env'
import {createBitdriftTransport} from './bitdriftTransport'
import {Metadata} from './types'
import {ConsoleTransportEntry, LogLevel, Transport} from './types'

export {LogLevel}
export type {ConsoleTransportEntry, Transport}

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

export function prepareMetadata(metadata: Metadata): Metadata {
  return Object.keys(metadata).reduce((acc, key) => {
    let value = metadata[key]
    if (value instanceof Error) {
      value = value.toString()
    }
    return {...acc, [key]: value}
  }, {})
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
    ? ' ' + JSON.stringify(prepareMetadata(metadata), null, '  ')
    : ''
  const log = {
    [LogLevel.Debug]: console.debug,
    [LogLevel.Info]: console.info,
    [LogLevel.Log]: console.log,
    [LogLevel.Warn]: console.warn,
    [LogLevel.Error]: console.error,
  }[level]

  if (message instanceof Error) {
    console.info(
      `${format(timestamp, 'HH:mm:ss')} ${message.toString()}${extra}`,
    )
    log(message)
  } else {
    log(`${format(timestamp, 'HH:mm:ss')} ${message.toString()}${extra}`)
  }
}

export const sentryTransport: Transport = (
  level,
  message,
  {type, tags, ...metadata},
  timestamp,
) => {
  const meta = prepareMetadata(metadata)

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
      data: meta,
      type: type || 'default',
      level: severity,
      timestamp: timestamp / 1000, // Sentry expects seconds
    })

    // We don't want to send any network errors to sentry
    if (isNetworkError(message)) {
      return
    }

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
      // Defer non-critical messages so they're sent in a batch
      queueMessageForSentry(message, {
        level: messageLevel,
        tags,
        extra: meta,
      })
    }
  } else {
    /**
     * It's otherwise an Error and should be reported with captureException
     */
    Sentry.captureException(message, {
      tags,
      extra: meta,
    })
  }
}

const queuedMessages: [string, Parameters<typeof Sentry.captureMessage>[1]][] =
  []
let sentrySendTimeout: ReturnType<typeof setTimeout> | null = null
function queueMessageForSentry(
  message: string,
  captureContext: Parameters<typeof Sentry.captureMessage>[1],
) {
  queuedMessages.push([message, captureContext])
  if (!sentrySendTimeout) {
    // Throttle sending messages with a leading delay
    // so that we can get Sentry out of the critical path.
    sentrySendTimeout = setTimeout(() => {
      sentrySendTimeout = null
      sendQueuedMessages()
    }, 7000)
  }
}
function sendQueuedMessages() {
  while (queuedMessages.length > 0) {
    const record = queuedMessages.shift()
    if (record) {
      Sentry.captureMessage(record[0], record[1])
    }
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

    const timestamp = Date.now()
    const meta = metadata || {}

    // send every log to syslog
    add({
      id: nanoid(),
      timestamp,
      level,
      message,
      metadata: meta,
    })

    if (!enabledLogLevels[this.level].includes(level)) return

    for (const transport of this.transports) {
      transport(level, message, meta, timestamp)
    }
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

if (!env.IS_TEST) {
  logger.addTransport(createBitdriftTransport())
}

if (env.IS_DEV && !env.IS_TEST) {
  logger.addTransport(consoleTransport)

  /*
   * Comment this out to disable Sentry transport in dev
   */
  // logger.addTransport(sentryTransport)
} else if (env.IS_PROD) {
  logger.addTransport(sentryTransport)
}
