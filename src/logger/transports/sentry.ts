import {isNetworkError} from '#/lib/strings/errors'
import {LogLevel, type Transport} from '#/logger/types'
import {prepareMetadata} from '#/logger/util'

export const sentryTransport: Transport = (
  level,
  context,
  message,
  {tags, ...metadata},
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
  }
}

const queuedMessages: [string, Parameters<any>[1]][] = []
let sentrySendTimeout: ReturnType<typeof setTimeout> | null = null

function queueMessageForSentry(
  message: string,
  captureContext: Parameters<any>[1],
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

function sendQueuedMessages() {}
