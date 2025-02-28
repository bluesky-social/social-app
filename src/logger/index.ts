import {nanoid} from 'nanoid/non-secure'

import {add} from '#/logger/logDump'
import {bitdriftTransport} from '#/logger/transports/bitdrift'
import {consoleTransport} from '#/logger/transports/console'
import {sentryTransport} from '#/logger/transports/sentry'
import {LogContext, LogLevel, Metadata, Transport} from '#/logger/types'
import {enabledLogLevels} from '#/logger/util'

const TRANSPORTS: Transport[] = (function configureTransports() {
  switch (process.env.NODE_ENV) {
    case 'production': {
      return [sentryTransport, bitdriftTransport].filter(Boolean) as Transport[]
    }
    case 'test': {
      return []
    }
    default: {
      return [consoleTransport]
    }
  }
})()

export class Logger {
  static Level = LogLevel
  static Context = LogContext

  level: LogLevel
  context: LogContext | undefined = undefined
  contextFilter: string = ''

  protected debugContextRegexes: RegExp[] = []
  protected transports: Transport[] = []

  static create(context?: LogContext) {
    const logger = new Logger({
      level: process.env.EXPO_PUBLIC_LOG_LEVEL as LogLevel,
      context,
      contextFilter: process.env.EXPO_PUBLIC_LOG_DEBUG || '',
    })
    for (const transport of TRANSPORTS) {
      logger.addTransport(transport)
    }
    return logger
  }

  constructor({
    level,
    context,
    contextFilter,
  }: {
    level?: LogLevel
    context?: LogContext
    contextFilter?: string
  } = {}) {
    this.context = context
    this.level = level || LogLevel.Info
    this.contextFilter = contextFilter || ''
    if (this.contextFilter) {
      this.level = LogLevel.Debug
    }
    this.debugContextRegexes = (this.contextFilter || '')
      .split(',')
      .map(filter => {
        return new RegExp(filter.replace(/[^\w:*-]/, '').replace(/\*/g, '.*'))
      })
  }

  debug(message: string, metadata: Metadata = {}) {
    this.transport({level: LogLevel.Debug, message, metadata})
  }

  info(message: string, metadata: Metadata = {}) {
    this.transport({level: LogLevel.Info, message, metadata})
  }

  log(message: string, metadata: Metadata = {}) {
    this.transport({level: LogLevel.Log, message, metadata})
  }

  warn(message: string, metadata: Metadata = {}) {
    this.transport({level: LogLevel.Warn, message, metadata})
  }

  error(error: Error | string, metadata: Metadata = {}) {
    this.transport({level: LogLevel.Error, message: error, metadata})
  }

  addTransport(transport: Transport) {
    this.transports.push(transport)
    return () => {
      this.transports.splice(this.transports.indexOf(transport), 1)
    }
  }

  protected transport({
    level,
    message,
    metadata = {},
  }: {
    level: LogLevel
    message: string | Error
    metadata: Metadata
  }) {
    if (
      level === LogLevel.Debug &&
      !!this.contextFilter &&
      !!this.context &&
      !this.debugContextRegexes.find(reg => reg.test(this.context!))
    )
      return

    const timestamp = Date.now()
    const meta = metadata || {}

    // send every log to syslog
    add({
      id: nanoid(),
      timestamp,
      level,
      context: this.context,
      message,
      metadata: meta,
    })

    if (!enabledLogLevels[this.level].includes(level)) return

    for (const transport of this.transports) {
      transport(level, this.context, message, meta, timestamp)
    }
  }
}

/**
 * Default logger instance. See `@/logger/README` for docs.
 *
 * Basic usage:
 *
 *   `logger.debug(message[, metadata])`
 *   `logger.info(message[, metadata])`
 *   `logger.log(message[, metadata])`
 *   `logger.warn(message[, metadata])`
 *   `logger.error(error[, metadata])`
 */
export const logger = Logger.create(Logger.Context.Default)
