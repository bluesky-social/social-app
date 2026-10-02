// Why the compress engine returned the input unchanged. Used both as the
// reason on `CompressedVideo.passthroughReason` and as the `skipReason` field
// on the `video:upload:compressSkipped` analytics event, so the two stay in
// sync.
export type VideoCompressSkipReason =
  'gif' | 'below-byte-threshold' | 'no-webcodecs' | 'compress-error-fallback'

/**
 * Why the user gave up on an upload: they removed the video (or its post), or
 * closed the composer. Abort a telemetry signal with `'closed'` for the
 * latter; any other abort reason, including none, reads as `'removed'`.
 */
export type VideoAbandonReason = 'removed' | 'closed'

/** Why a new upload attempt replaced an earlier one for the same video. */
export type VideoRestartReason = 'retry' | 'captions'

/** A source rejected before compression, as `video:upload:validationFailed`. */
export type VideoValidationFailure =
  | 'unsupported-video-format'
  | 'invalid-video-dimensions'
  | 'video-too-long'
  | 'video-too-large'

export type CompressedVideo = {
  uri: string
  mimeType: string
  size: number
  // web only, can fall back to uri if missing
  bytes?: ArrayBuffer
  // Set when the engine returned the input unchanged. Undefined means the
  // bytes were actually re-encoded.
  passthroughReason?: VideoCompressSkipReason
}

// Source container metadata read off the input before any encoding decision.
// Same shape across native (@bsky.app/video-compressor probe) and web
// (mediabunny Input + track inspection). Numbers are raw - no bucketing.
export type ProbedMetadata = {
  mimeType: string
  codec: string
  width: number
  height: number
  duration: number
  bitrate: number
  fileSize: number
  hasAudio: boolean
  frameRate: number
  rotation: number
  isHDR: boolean
}
