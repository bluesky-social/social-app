/*
 * Multipart upload knobs. Tunable; part size must stay above the storage
 * backend's minimum (R2/S3 require >= 5 MiB per part, except the last).
 */

/** Max parts uploaded concurrently. */
export const MULTIPART_CONCURRENCY = 3

/** Per-part upload attempts before the part (and the upload) fails. */
export const MULTIPART_MAX_ATTEMPTS = 3

/** Attempts to begin/continue server-side finalization before checking state. */
export const MULTIPART_FINISH_ATTEMPTS = 3
