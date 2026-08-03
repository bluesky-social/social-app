/*
 * Multipart upload knobs. Tunable; part size must stay above the storage
 * backend's minimum (R2/S3 require >= 5 MiB per part, except the last).
 */

/** Max parts uploaded concurrently. */
export const MULTIPART_CONCURRENCY = 4

/** Per-part upload attempts before the part (and the upload) fails. */
export const MULTIPART_MAX_ATTEMPTS = 5

/** Maximum time to wait for an individual part request to settle. */
export const MULTIPART_PART_TIMEOUT_MS = 120_000

/** Maximum time to wait for each best-effort abort request. */
export const MULTIPART_ABORT_TIMEOUT_MS = 10_000

/** Attempts to release a failed multipart upload reservation. */
export const MULTIPART_ABORT_ATTEMPTS = 3

/** Attempts to begin/continue server-side finalization before checking state. */
export const MULTIPART_FINISH_ATTEMPTS = 3
