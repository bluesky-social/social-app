import {isNetworkError} from '#/lib/strings/errors'
import {Sentry} from '#/logger/sentry/lib'
import {LogLevel, Transport} from '#/logger/types'
import {prepareMetadata} from '#/logger/util'

export const sentryTransport: Transport = (
  level,
  context,
  message,
  {type, tags, ...metadata},
  timestamp,
) => {
  const meta = {
    // match Bitdrift payload
    context,
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

    // We don't want to send any network errors to sentry
    if (isNetworkError(message)) {
      return
    }

    /**
     * Send all higher levels with `captureMessage`, with appropriate severity
     * level
     */
    if (level === 'error' || level === 'warn' || level === 'log') {
      // Defer non-critical messages so they're sent in a batch
      queueMessageForSentry(message, {
        level: severity,
        tags: _tags,
        extra: meta,
      })
    }
  } else {
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
