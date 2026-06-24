// Shared compression knobs. Mirrored between native (compress.ts) and web
// (compress.web.ts) so both platforms produce videos with the same target.

export const COMPRESSION_TARGET_BITRATE = 3_000_000 // 3 Mbps
export const COMPRESSION_MAX_DIMENSION = 1920
// Web skips compression entirely for files under this size; native applies its
// own threshold logic inside expo-bluesky-video-compress's probe step.
export const COMPRESSION_MIN_SIZE_BYTES = 25_000_000
