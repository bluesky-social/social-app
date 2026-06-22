// Target encode bitrate when we do compress. Matches the web path.
export const COMPRESSION_TARGET_BITRATE = 3_000_000 // 3mbps
// Source files at or under this bitrate skip compression (paired with
// COMPRESSION_MAX_DIMENSION). Slightly above the encode target so we
// don't re-encode files that are already close to what we'd produce.
export const COMPRESSION_PASSTHROUGH_BITRATE = 5_000_000 // 5mbps
// Output dimension cap when compressing, and skip threshold for source files.
export const COMPRESSION_MAX_DIMENSION = 1920
