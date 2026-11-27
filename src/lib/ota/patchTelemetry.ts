import {
  fetchUpdateAsync,
  isEmbeddedLaunch,
  readLogEntriesAsync,
  type UpdateFetchResult,
  type UpdatesLogEntry,
} from 'expo-updates'

import {isNetworkError, safeStringify} from '#/lib/network-error'
import {logger} from '#/logger'
import {type Metrics, metrics} from '#/analytics/metrics'

/**
 * Why expo-updates gave up on a bsdiff patch for the JS bundle and downloaded
 * the whole bundle instead.
 *
 * - `unrequestedPatch`: the server sent a patch that the app didn't ask for,
 *   or can't use.
 * - `baseUpdateIdMismatch`: the patch's `expo-base-update-id` header was
 *   missing, or named a different update from the one that's running.
 * - `baseUnavailable`: the running update's bundle, which the patch applies
 *   to, couldn't be found or read.
 * - `baseHashMismatch`: the running update's bundle no longer matches its
 *   recorded hash.
 * - `patchedHashMismatch`: the patch applied, but the result didn't match the
 *   manifest's hash, i.e. the server diffed against different bytes from the
 *   ones the app has. iOS only: Android reports this as `patchFailed`.
 * - `patchFailed`: bspatch failed, or a file couldn't be read or written while
 *   applying the patch.
 * - `unknown`: an iOS patch failure we don't recognize.
 */
export type OTAPatchFallbackReason =
  | 'unrequestedPatch'
  | 'baseUpdateIdMismatch'
  | 'baseUnavailable'
  | 'baseHashMismatch'
  | 'patchedHashMismatch'
  | 'patchFailed'
  | 'unknown'

export type OTAPatchOutcome = {
  patched: boolean
  patchFallbackReason?: OTAPatchFallbackReason
}

type MetricFn = <E extends keyof Metrics>(event: E, payload: Metrics[E]) => void

/**
 * Logged on both platforms once a patch has been applied and its result
 * matches the manifest's hash.
 */
const APPLIED_DIFF_PREFIX = 'Applied diff for asset '

/**
 * Warnings and errors that expo-updates logs before it retries with a full
 * download, from `FileDownloader.swift` and `FileDownloader.kt` in
 * expo-updates 58. We match on messages, because their `AssetsFailedToLoad`
 * code also covers unrelated asset failures.
 */
const FALLBACK_MESSAGE_PREFIXES: [string, OTAPatchFallbackReason][] = [
  // iOS
  ['Received patch when patch support disabled for asset ', 'unrequestedPatch'],
  // Android
  [
    'Received patch response even though patch application is disabled',
    'unrequestedPatch',
  ],
  // Both
  [
    'Patch response missing required headers or had mismatched identifiers',
    'baseUpdateIdMismatch',
  ],
  // iOS
  [
    'Missing launched update when attempting to apply diff for asset ',
    'baseUnavailable',
  ],
  // Android
  ['Asset hash mismatch for update ', 'baseHashMismatch'],
  // Android, covers both a bspatch failure and a mismatched result hash
  ['Failed to apply patch for asset ', 'patchFailed'],
  /*
   * Android logs this after every failed attempt to apply a patch, but a base
   * hash mismatch and a failure applying the patch each log their own entry
   * first. So when this is the first one, preparing the base bundle failed.
   */
  ['Patch application failed for asset ', 'baseUnavailable'],
]

/**
 * iOS logs a failed patch as "Unknown error: " followed by Foundation's
 * fallback description for a Swift error, in the device's language, e.g. "The
 * operation couldn't be completed. (EXUpdates.FileDownloader.DiffError error
 * 9.)", because `DiffError` doesn't conform to `LocalizedError`. The number is
 * all we get, and Swift assigns it by numbering the enum's cases with
 * associated values first, in declaration order, and then the rest. Recheck
 * this table whenever `DiffError` changes in an expo-updates upgrade.
 */
const IOS_DIFF_ERROR_REASONS: Partial<Record<number, OTAPatchFallbackReason>> =
  {
    2: 'baseUnavailable', // baseAssetMissing
    3: 'baseUnavailable', // failedToReadBaseAsset
    4: 'patchFailed', // failedToWritePatch
    5: 'patchFailed', // patchFailed (bspatch)
    6: 'patchFailed', // failedToReadPatchedAsset
    7: 'patchFailed', // failedToWritePatchedAsset
    8: 'baseHashMismatch', // baseHashMismatch
    9: 'patchedHashMismatch', // patchedHashMismatch
    10: 'baseHashMismatch', // baseHexHashMismatch
    11: 'unrequestedPatch', // assetNotLaunch
    14: 'baseUnavailable', // launchAssetNotFound
    15: 'baseUnavailable', // embeddedBaseAssetMissing
  }

function getFallbackReason(
  message: string,
): OTAPatchFallbackReason | undefined {
  for (const [prefix, reason] of FALLBACK_MESSAGE_PREFIXES) {
    if (message.startsWith(prefix)) return reason
  }
  if (message.includes('DiffError')) {
    const code = message.match(/DiffError\D*(\d+)/)?.[1]
    return (code && IOS_DIFF_ERROR_REASONS[Number(code)]) || 'unknown'
  }
}

type LogEntry = Pick<UpdatesLogEntry, 'timestamp' | 'message'>

/**
 * Messages of the log entries written since `since` (in ms), oldest first.
 */
function getMessagesSince(entries: LogEntry[], since: number) {
  // iOS truncates log timestamps to the second
  const windowStart = Math.floor(since / 1e3) * 1e3
  return entries
    .filter(entry => entry.timestamp >= windowStart)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(entry => entry.message)
}

/**
 * Works out from the expo-updates log whether the update downloaded since
 * `since` (in ms) was patched, and if the app fell back to a full download,
 * why.
 */
export function classifyOTAPatchLogEntries(
  entries: LogEntry[],
  since: number,
): OTAPatchOutcome {
  const messages = getMessagesSince(entries, since)
  if (messages.some(message => message.startsWith(APPLIED_DIFF_PREFIX))) {
    return {patched: true}
  }
  // The first fallback is the cause, any later ones come from its retry
  for (const message of messages) {
    const patchFallbackReason = getFallbackReason(message)
    if (patchFallbackReason) return {patched: false, patchFallbackReason}
  }
  return {patched: false}
}

/**
 * Why `fetchUpdateAsync` failed.
 *
 * - `assetHashMismatch`: a downloaded asset didn't match the manifest's hash.
 *   After a patch fallback, this is what a CDN serving patch bytes to the full
 *   download looks like.
 * - `network`: the connection failed. On iOS this is only recognized when the
 *   device is in English, so elsewhere it's reported as `other`.
 * - `other`: anything else, e.g. an HTTP error status.
 */
export type OTADownloadFailureReason = 'assetHashMismatch' | 'network' | 'other'

/**
 * Shared by iOS's "Asset download was successful but base64url-encoded SHA-256
 * did not match expected; ...", which it logs, and Android's "File download was
 * successful but base64url-encoded SHA-256 did not match expected; ...", which
 * only makes it into the error that `fetchUpdateAsync` rejects with.
 */
const ASSET_HASH_MISMATCH = 'base64url-encoded SHA-256 did not match expected'

/**
 * Works out why `fetchUpdateAsync` failed, from its error and the expo-updates
 * log since `since` (in ms), and whether a patch was abandoned on the way.
 */
export function classifyOTADownloadFailure(
  error: unknown,
  entries: LogEntry[],
  since: number,
): {
  failureReason: OTADownloadFailureReason
  patchFallbackReason?: OTAPatchFallbackReason
} {
  const messages = [
    safeStringify(error) ?? '',
    ...getMessagesSince(entries, since),
  ]
  const {patchFallbackReason} = classifyOTAPatchLogEntries(entries, since)
  return {failureReason: getFailureReason(messages), patchFallbackReason}
}

function getFailureReason(messages: string[]): OTADownloadFailureReason {
  if (messages.some(message => message.includes(ASSET_HASH_MISMATCH))) {
    return 'assetHashMismatch'
  }
  if (messages.some(message => isNetworkError(message))) {
    return 'network'
  }
  return 'other'
}

/**
 * Updates reported this session. Fetching an update that has already
 * downloaded succeeds without downloading anything, e.g. when the TestFlight
 * check runs again after the user declined to relaunch.
 */
const reportedUpdateIds = new Set<string>()

/**
 * Calls `fetchUpdateAsync`, and reports the outcome in the background as an
 * `ota:download` or `ota:downloadFailed` event. Resolves and rejects exactly
 * as `fetchUpdateAsync` does, as reporting never throws and isn't awaited.
 */
export async function fetchUpdateAndReport({
  metric,
  channel,
  requestedUpdateId,
}: {
  metric: MetricFn
  /** The channel the update is fetched from. */
  channel: string
  /** The update that `checkForUpdateAsync` found, reported if this fails. */
  requestedUpdateId: string | undefined
}): Promise<UpdateFetchResult> {
  const fetchStartedAt = Date.now()
  try {
    const result = await fetchUpdateAsync()
    void reportDownload({metric, result, fetchStartedAt, channel})
    return result
  } catch (e) {
    void reportFailure({
      metric,
      error: e,
      fetchStartedAt,
      channel,
      updateId: requestedUpdateId,
    })
    throw e
  }
}

function readLogEntriesSince(since: number) {
  // Leave a margin, iOS reads whole seconds
  return readLogEntriesAsync(Date.now() - since + 5e3)
}

async function reportDownload({
  metric,
  result,
  fetchStartedAt,
  channel,
}: {
  metric: MetricFn
  result: UpdateFetchResult
  fetchStartedAt: number
  channel: string
}) {
  try {
    if (!result.isNew) return
    const updateId = result.manifest.id
    if (reportedUpdateIds.has(updateId)) return
    reportedUpdateIds.add(updateId)

    const entries = await readLogEntriesSince(fetchStartedAt)
    metric('ota:download', {
      ...classifyOTAPatchLogEntries(entries, fetchStartedAt),
      updateId,
      channel,
      isEmbeddedLaunch,
    })
    /*
     * Send it now rather than with the next periodic flush, because reloading
     * into the update (e.g. tapping Relaunch) cancels requests in flight and
     * drops anything still queued.
     */
    metrics.flush()
  } catch (e) {
    logger.error('Failed to report OTA download', {safeMessage: e})
  }
}

async function reportFailure({
  metric,
  error,
  fetchStartedAt,
  channel,
  updateId,
}: {
  metric: MetricFn
  error: unknown
  fetchStartedAt: number
  channel: string
  updateId: string | undefined
}) {
  try {
    const entries = await readLogEntriesSince(fetchStartedAt)
    metric('ota:downloadFailed', {
      ...classifyOTADownloadFailure(error, entries, fetchStartedAt),
      updateId,
      channel,
      isEmbeddedLaunch,
    })
    metrics.flush()
  } catch (e) {
    logger.error('Failed to report OTA download failure', {safeMessage: e})
  }
}
