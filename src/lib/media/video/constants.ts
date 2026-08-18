// Shared compression knobs. Mirrored between native (compress.ts) and web
// (compress.web.ts) so both platforms produce videos with the same target.

// Target encode bitrate when we do compress.
export const COMPRESSION_TARGET_BITRATE = 3_000_000 // 3 Mbps
// Output dimension cap when compressing, and skip threshold for source files.
export const COMPRESSION_MAX_DIMENSION = 1920
// Web only: files under this size skip compression entirely. Native uses a
// 25 MiB threshold in compress.ts for compatibility with the previous engine.
export const COMPRESSION_MIN_SIZE_BYTES = 25_000_000
