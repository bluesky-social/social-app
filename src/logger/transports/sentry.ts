import {Sentry} from '#/logger/sentry/lib'
import {isExpectedSentryNetworkError} from '#/logger/sentry/network-errors'
import {LogLevel, type Transport} from '#/logger/types'
import {prepareMetadata} from '#/logger/util'

export const sentryTransport: Transport = (
  level,
  context,
  message,
  {type, tags, fingerprint, ...metadata},
  timestamp,
) => {
  // Skip debug messages entirely for now - esb
  if (level === LogLevel.Debug) return

  const meta = {
    __context__: context,
    ...prepareMetadata(metadata),
  }
  let _tags = tags || {}
  _tags = {
    // use `category` to match breadcrumbs
    category: context,
    ...tags,
  }

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
      category: context,
      message,
      data: meta,
      type: type || 'default',
      level: severity,
      timestamp: timestamp / 1000, // Sentry expects seconds
    })

    /*
     * Keep the breadcrumb, but don't send expected network failures as events.
     * The underlying cause is often passed in metadata rather than the message
     * itself, and call sites do not consistently use the same metadata key.
     */
    if (
      isExpectedSentryNetworkError(message) ||
      Object.values(metadata).some(isExpectedSentryNetworkError)
    ) {
      return
    }

    /**
     * Only error-level strings are reported to Sentry as events. Lower levels
     * are captured as breadcrumbs above and attached to the next event, if
     * any.
     */
    if (level === LogLevel.Error) {
      // Defer non-critical messages so they're sent in a batch
      queueMessageForSentry(message, {
        level: severity,
        tags: _tags,
        extra: meta,
        ...(fingerprint ? {fingerprint} : {}),
      })
    }
  } else {
    if (
      isExpectedSentryNetworkError(message) ||
      Object.values(metadata).some(isExpectedSentryNetworkError)
    ) {
      return
    }

    /**
     * It's otherwise an Error and should be reported with captureException
     */
    Sentry.captureException(message, {
      tags: _tags,
      extra: meta,
      ...(fingerprint ? {fingerprint} : {}),
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
