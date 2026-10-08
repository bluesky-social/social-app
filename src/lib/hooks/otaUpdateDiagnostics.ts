import {
  readLogEntriesAsync,
  type UpdatesLogEntry,
  UpdatesLogEntryCode,
  UpdatesLogEntryLevel,
} from 'expo-updates'

import {isNetworkError, safeStringify} from '#/lib/network-error'
import {logger} from '#/logger'

const MAX_LOG_AGE = 5 * 60_000
const MAX_LOG_ENTRIES = 5

export type OTAUpdateStage = 'configure' | 'check' | 'fetch'
export type OTAUpdateTrigger = 'launch' | 'resume'

function getErrorCode(error: unknown) {
  try {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = error.code
      if (typeof code === 'string' && /^ERR_UPDATES_[A-Z_]+$/.test(code)) {
        return code
      }
    }
  } catch {
    // Proxies can throw while reading properties of an error.
  }
  return (
    safeStringify(error)?.match(/\bERR_UPDATES_[A-Z_]+\b/)?.[0] ?? 'unknown'
  )
}

function summarizeLog(entry: UpdatesLogEntry, startedAt: number) {
  /*
   * Expo's raw messages can contain response bodies, full URLs, and local file
   * paths. Only extract bounded diagnostic fields; never upload the message or
   * native stack trace.
   */
  const httpStatus = entry.message.match(
    /\bHTTP response error ([1-5]\d{2})\b/i,
  )?.[1]
  const urlErrorCode = entry.message.match(
    /\bNSURLErrorDomain[^\n]{0,100}?\bCode=(-?\d+)\b/,
  )?.[1]
  const updateId = entry.updateId?.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  )?.[0]

  return {
    code: entry.code,
    level: entry.level,
    msSinceStart: entry.timestamp - startedAt,
    ...(updateId ? {updateId} : {}),
    ...(httpStatus ? {httpStatus: Number(httpStatus)} : {}),
    ...(urlErrorCode ? {urlErrorCode: Number(urlErrorCode)} : {}),
    networkSignal:
      entry.code === UpdatesLogEntryCode.UPDATE_SERVER_UNREACHABLE ||
      urlErrorCode !== undefined ||
      isNetworkError(entry.message),
  }
}

/**
 * Attach only logs emitted during this OTA attempt to the Sentry event. Expo
 * errors often lose the native cause by the time they reach JavaScript.
 */
export async function logOTAUpdateError({
  error,
  stage,
  trigger,
  startedAt,
}: {
  error: unknown
  stage: OTAUpdateStage
  trigger: OTAUpdateTrigger
  startedAt: number
}) {
  let nativeLogStatus = 'empty'
  let nativeLogs: ReturnType<typeof summarizeLog>[] = []

  /*
   * Expo's log buffer is global, so bound both ends of the window. Anything
   * written after the failure (e.g. an overlapping resume check) is not ours.
   */
  const failedAt = Date.now()

  try {
    const maxAge = Math.min(
      MAX_LOG_AGE,
      Math.max(1_000, failedAt - startedAt + 1_000),
    )
    const entries = await readLogEntriesAsync(maxAge)
    nativeLogs = entries
      .filter(
        entry =>
          entry.timestamp >= startedAt &&
          entry.timestamp <= failedAt &&
          (entry.level === UpdatesLogEntryLevel.WARN ||
            entry.level === UpdatesLogEntryLevel.ERROR ||
            entry.level === UpdatesLogEntryLevel.FATAL),
      )
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-MAX_LOG_ENTRIES)
      .map(entry => summarizeLog(entry, startedAt))
    if (nativeLogs.length) nativeLogStatus = 'present'
  } catch {
    // Failure to read Expo's logs must not hide the original update error.
    nativeLogStatus = 'unavailable'
  }

  const primaryLog =
    nativeLogs.findLast(
      log =>
        log.code !== UpdatesLogEntryCode.NONE &&
        log.code !== UpdatesLogEntryCode.UNKNOWN,
    ) ?? nativeLogs.at(-1)
  const httpStatus = nativeLogs.findLast(log => log.httpStatus)?.httpStatus
  const urlErrorCode = nativeLogs.findLast(
    log => log.urlErrorCode,
  )?.urlErrorCode

  logger.error('OTA Update Error', {
    safeMessage: error,
    tags: {
      ota_stage: stage,
      ota_trigger: trigger,
      ota_error_code: getErrorCode(error),
      ota_native_log_status: nativeLogStatus,
      ota_native_code: primaryLog?.code ?? 'none',
      ota_native_network_signal: nativeLogs.some(log => log.networkSignal)
        ? 'seen'
        : nativeLogs.length
          ? 'not_seen'
          : 'unavailable',
      ...(httpStatus ? {ota_http_status: httpStatus} : {}),
      ...(urlErrorCode ? {ota_url_error_code: urlErrorCode} : {}),
    },
    nativeUpdateLogs: nativeLogs,
  })
}
