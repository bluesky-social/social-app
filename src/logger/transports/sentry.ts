import {isNetworkError} from '#/lib/strings/errors'
import {Sentry} from '#/logger/sentry/lib'
import {LogLevel, type Transport} from '#/logger/types'
import {prepareMetadata} from '#/logger/util'

export const sentryTransport: Transport = (
  level,
  context,
  message,
  {type, tags, ...metadata},
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

    // We don't want to send any network errors to sentry. The underlying
    // cause is often passed via metadata rather than the message itself, so
    // check the common metadata keys too.
    if (
      isNetworkError(message) ||
      isNetworkError(metadata.safeMessage) ||
      isNetworkError(metadata.message) ||
      isNetworkError(metadata.error)
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
      })
    }
  } else {
    // We don't want to send any network errors to sentry
    if (isNetworkError(message)) {
      return
    }

    /**
     * It's otherwise an Error and should be reported with captureException
     */
    Sentry.captureException(message, {
      tags: _tags,
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
