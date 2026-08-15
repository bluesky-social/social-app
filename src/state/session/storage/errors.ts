import {Logger} from '#/logger'

const logger = Logger.create(Logger.Context.Session)

export type SessionStorageErrorKind =
  'unavailable' | 'invalid-data' | 'storage-full' | 'write-failed'

export type SessionStorageErrorOperation =
  'init' | 'backfill' | 'write' | 'retry' | 'clear'

export type SessionStorageError = {
  kind: SessionStorageErrorKind
  operation: SessionStorageErrorOperation
}

/**
 * Thrown when stored session data exists but fails to parse or validate. Kept
 * distinct from an unavailable-storage failure so callers can tell "the store
 * holds nothing usable" from "the store could not be reached".
 */
export class InvalidSessionStorageDataError extends Error {}

/**
 * Classify a thrown error into a {@link SessionStorageError}. Invalid data is
 * reported as such; a storage-full message is detected by the regex below;
 * every other failure is `unavailable` while reading at boot and
 * `write-failed` otherwise.
 */
export function storageError(
  operation: SessionStorageErrorOperation,
  cause: unknown,
): SessionStorageError {
  const message = cause instanceof Error ? cause.message : String(cause)
  const kind =
    cause instanceof InvalidSessionStorageDataError
      ? 'invalid-data'
      : /quota|disk.*full|storage.*full|no space/i.test(message)
        ? 'storage-full'
        : operation === 'init'
          ? 'unavailable'
          : 'write-failed'
  return {kind, operation}
}

export function logStorageError(error: SessionStorageError) {
  /*
   * Never attach the underlying native error: some platforms include the key
   * in it. Keys are hashed, but keeping telemetry credential-agnostic is safer.
   */
  logger.error('session storage operation failed', {
    kind: error.kind,
    operation: error.operation,
    tags: {
      session_storage_kind: error.kind,
      session_storage_operation: error.operation,
    },
  })
}
