import {Sentry} from '#/logger/sentry/lib'
import {isExpectedSentryNetworkError} from '#/logger/sentry/network-errors'
import {LogLevel, type Metadata, type Transport} from '#/logger/types'
import {prepareMetadata} from '#/logger/util'

/**
 * Metadata keys that have historically carried the underlying failure as a
 * plain string.
 */
const CHECKED_METADATA_KEYS = ['safeMessage', 'message', 'error']

/**
 * Whether this log records a network failure Sentry should not be told about.
 *
 * The failure is often passed in metadata rather than as the message, and call
 * sites do not consistently use the same key, so any `Error` value counts no
 * matter which key holds it. Values of other types only count under the keys
 * above: metadata is arbitrary, and scanning all of it lets an unrelated string
 * - a stream URL containing "abort", say - suppress a real error.
 */
function isExpectedNetworkFailure(
  message: string | Error,
  metadata: Metadata,
): boolean {
  if (isExpectedSentryNetworkError(message)) {
    return true
  }
  for (const value of Object.values(metadata)) {
    if (value instanceof Error && isExpectedSentryNetworkError(value)) {
      return true
    }
  }
  return CHECKED_METADATA_KEYS.some(
    key => key in metadata && isExpectedSentryNetworkError(metadata[key]),
  )
}

export const sentryTransport: Transport = (
  level,
  context,
  message,
  {type, tags, fingerprint, __metadata__, ...metadata},
  timestamp,
) => {
  // Skip debug messages entirely for now - esb
  if (level === LogLevel.Debug) return

  /*
   * `__metadata__` is ambient context rather than something the call site
   * passed, so it is destructured out of the scanned metadata and folded back
   * in here to keep the attached data unchanged.
   */
  const meta = {
    __context__: context,
    ...prepareMetadata(__metadata__ ? {__metadata__, ...metadata} : metadata),
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

    /**
     * Only error-level strings are reported to Sentry as events. Lower levels
     * are captured as breadcrumbs above and attached to the next event, if
     * any - so the network check only has to run here.
     */
    if (level === LogLevel.Error) {
      // Keep the breadcrumb, but don't send expected network failures as events
      if (isExpectedNetworkFailure(message, metadata)) return

      // Defer non-critical messages so they're sent in a batch
      queueMessageForSentry(message, {
        level: severity,
        tags: _tags,
        extra: meta,
        ...(fingerprint ? {fingerprint} : {}),
      })
    }
  } else {
    if (isExpectedNetworkFailure(message, metadata)) return

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
