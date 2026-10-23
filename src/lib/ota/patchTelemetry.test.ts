import {classifyOTAPatchLogEntries} from './patchTelemetry'

/*
 * Messages are copied from expo-updates 58's `FileDownloader.swift` and
 * `FileDownloader.kt`, with their interpolations filled in.
 */
const ASSET_KEY = 'f3c4e5a6b7c8d9e0'
const FETCH_STARTED_AT = Date.UTC(2026, 9, 23, 12, 0, 0, 500)

function entry(message: string, offsetMs = 100) {
  return {timestamp: FETCH_STARTED_AT + offsetMs, message}
}

/**
 * How iOS logs a `DiffError`, whose description isn't a `LocalizedError`, so
 * only its case number makes it into the log.
 */
function iosDiffError(code: number) {
  return `Unknown error: The operation couldn’t be completed. (EXUpdates.FileDownloader.DiffError error ${code}.)`
}

describe('classifyOTAPatchLogEntries', () => {
  it('reports a full download when nothing patch-related was logged', () => {
    expect(classifyOTAPatchLogEntries([], FETCH_STARTED_AT)).toEqual({
      patched: false,
    })
    expect(
      classifyOTAPatchLogEntries(
        [
          entry(
            'fetchUpdateAsync didLoadAsset: ["assetInfo": ["assetName": "f3c4e5a6b7c8d9e0.bundle"]]',
          ),
          entry(
            'Updates state change: state = downloading, event = downloadComplete',
          ),
        ],
        FETCH_STARTED_AT,
      ),
    ).toEqual({patched: false})
  })

  it('reports a patch that applied', () => {
    expect(
      classifyOTAPatchLogEntries(
        [entry(`Applied diff for asset ${ASSET_KEY}`)],
        FETCH_STARTED_AT,
      ),
    ).toEqual({patched: true})
  })

  it('ignores entries from before the fetch started', () => {
    expect(
      classifyOTAPatchLogEntries(
        [
          entry(`Applied diff for asset ${ASSET_KEY}`, -60e3),
          entry(
            'Patch response missing required headers or had mismatched identifiers; retrying with full asset download',
            -60e3,
          ),
        ],
        FETCH_STARTED_AT,
      ),
    ).toEqual({patched: false})
  })

  it('includes iOS entries whose timestamps were truncated to the second', () => {
    expect(
      classifyOTAPatchLogEntries(
        [
          {
            timestamp: Math.floor(FETCH_STARTED_AT / 1e3) * 1e3,
            message: `Applied diff for asset ${ASSET_KEY}`,
          },
        ],
        FETCH_STARTED_AT,
      ),
    ).toEqual({patched: true})
  })

  it.each([
    // iOS
    [
      `Received patch when patch support disabled for asset ${ASSET_KEY}`,
      'unrequestedPatch',
    ],
    [
      `Missing launched update when attempting to apply diff for asset ${ASSET_KEY}; retrying with full download`,
      'baseUnavailable',
    ],
    // Android
    [
      'Received patch response even though patch application is disabled; retrying with full asset download',
      'unrequestedPatch',
    ],
    [
      `Patch application failed for asset ${ASSET_KEY}; retrying with full asset download`,
      'baseUnavailable',
    ],
    // Both
    [
      'Patch response missing required headers or had mismatched identifiers; retrying with full asset download',
      'baseUpdateIdMismatch',
    ],
  ])('classifies %j as %s', (message, reason) => {
    expect(
      classifyOTAPatchLogEntries([entry(message)], FETCH_STARTED_AT),
    ).toEqual({patched: false, patchFallbackReason: reason})
  })

  it.each([
    [2, 'baseAssetMissing', 'baseUnavailable'],
    [3, 'failedToReadBaseAsset', 'baseUnavailable'],
    [4, 'failedToWritePatch', 'patchFailed'],
    [5, 'patchFailed', 'patchFailed'],
    [6, 'failedToReadPatchedAsset', 'patchFailed'],
    [7, 'failedToWritePatchedAsset', 'patchFailed'],
    [8, 'baseHashMismatch', 'baseHashMismatch'],
    [9, 'patchedHashMismatch', 'patchedHashMismatch'],
    [10, 'baseHexHashMismatch', 'baseHashMismatch'],
    [11, 'assetNotLaunch', 'unrequestedPatch'],
    [14, 'launchAssetNotFound', 'baseUnavailable'],
    [15, 'embeddedBaseAssetMissing', 'baseUnavailable'],
    // Declared but never thrown
    [12, 'databaseUnavailable', 'unknown'],
  ])('classifies iOS DiffError %i (%s) as %s', (code, _name, reason) => {
    expect(
      classifyOTAPatchLogEntries([entry(iosDiffError(code))], FETCH_STARTED_AT),
    ).toEqual({patched: false, patchFallbackReason: reason})
  })

  it('reads the iOS DiffError number in other languages', () => {
    // Foundation localizes the description into the device's language
    expect(
      classifyOTAPatchLogEntries(
        [
          entry(
            'Unknown error: Der Vorgang konnte nicht abgeschlossen werden. (EXUpdates.FileDownloader.DiffError-Fehler 9.)',
          ),
        ],
        FETCH_STARTED_AT,
      ),
    ).toEqual({patched: false, patchFallbackReason: 'patchedHashMismatch'})
  })

  it('reports an iOS DiffError without a number as unknown', () => {
    expect(
      classifyOTAPatchLogEntries(
        [entry('Unknown error: EXUpdates.FileDownloader.DiffError')],
        FETCH_STARTED_AT,
      ),
    ).toEqual({patched: false, patchFallbackReason: 'unknown'})
  })

  it('prefers the specific Android entry over the retry warning after it', () => {
    expect(
      classifyOTAPatchLogEntries(
        [
          entry(
            'Asset hash mismatch for update 0f6b8c2e-8d4a-4f1e-9b7a-3c5d2e1f0a9b; expected=AAAA actual=BBBB',
            100,
          ),
          entry(
            `Patch application failed for asset ${ASSET_KEY}; retrying with full asset download`,
            100,
          ),
        ],
        FETCH_STARTED_AT,
      ),
    ).toEqual({patched: false, patchFallbackReason: 'baseHashMismatch'})
    expect(
      classifyOTAPatchLogEntries(
        [
          entry(`Failed to apply patch for asset ${ASSET_KEY}`, 100),
          entry(
            `Patch application failed for asset ${ASSET_KEY}; retrying with full asset download`,
            100,
          ),
        ],
        FETCH_STARTED_AT,
      ),
    ).toEqual({patched: false, patchFallbackReason: 'patchFailed'})
  })

  it('reports the first fallback when its retry also got a patch', () => {
    expect(
      classifyOTAPatchLogEntries(
        // Out of order, as the log isn't guaranteed to be sorted
        [
          entry(
            `Received patch when patch support disabled for asset ${ASSET_KEY}`,
            2e3,
          ),
          entry(iosDiffError(9), 1e3),
        ],
        FETCH_STARTED_AT,
      ),
    ).toEqual({patched: false, patchFallbackReason: 'patchedHashMismatch'})
  })
})
