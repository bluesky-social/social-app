/**
 * DO NOT IMPORT THIS DIRECTLY
 *
 * Logger contexts, defined here and used via `Logger.Context.*` static prop.
 */
export enum LogContext {
  Default = 'logger',
  Session = 'session',
  Notifications = 'notifications',
  ConversationAgent = 'conversation-agent',
  DMsAgent = 'dms-agent',
}

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Log = 'log',
  Warn = 'warn',
  Error = 'error',
}

export type Transport = (
  level: LogLevel,
  context: LogContext | undefined,
  message: string | Error,
  metadata: Metadata,
  timestamp: number,
) => void

/**
 * A union of some of Sentry's breadcrumb properties as well as Sentry's
 * `captureException` parameter, `CaptureContext`.
 */
export type Metadata = {
  /**
   * Reserved for appending `LogContext` to logging payloads
   */
  context?: undefined

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
    [key: string]: number | string | boolean | null | undefined
  }

  /**
   * Any additional data, passed through to Sentry as `extra` param on
   * exceptions, or the `data` param on breadcrumbs.
   */
  [key: string]: Serializable | Error | unknown
}

export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | {
      [key: string]: Serializable
    }
