// Why the compress engine returned the input unchanged. Used both as the
// reason on `CompressedVideo.passthroughReason` and as the `skipReason` field
// on the `video:upload:compressSkipped` analytics event, so the two stay in
// sync.
export type VideoCompressSkipReason =
  | 'gif'
  | 'below-byte-threshold'
  | 'below-thresholds'
  | 'no-webcodecs'
  | 'compress-error-fallback'

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
