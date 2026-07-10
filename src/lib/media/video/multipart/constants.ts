/*
 * Multipart upload knobs. Tunable; part size must stay above the storage
 * backend's minimum (R2/S3 require >= 5 MiB per part, except the last).
 */

/** Target size per part. */
export const MULTIPART_PART_SIZE = 8 * 1024 * 1024 // 8 MiB

/**
 * Files below this skip multipart and use the single-shot POST. A file that
 * would be a single part gains nothing from the multipart machinery.
 */
export const MULTIPART_MIN_FILE_SIZE = 16 * 1024 * 1024 // 16 MiB

/** Max parts uploaded concurrently. */
export const MULTIPART_CONCURRENCY = 3

/** Per-part upload attempts before the part (and the upload) fails. */
export const MULTIPART_MAX_ATTEMPTS = 3
