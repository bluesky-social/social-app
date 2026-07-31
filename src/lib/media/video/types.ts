// Why the compress engine returned the input unchanged. Used both as the
// reason on `CompressedVideo.passthroughReason` and as the `skipReason` field
// on the `video:upload:compressSkipped` analytics event, so the two stay in
// sync.
export type VideoCompressSkipReason =
  | 'gif'
  | 'below-byte-threshold'
  | 'no-webcodecs'
  | 'compress-error-fallback'

export type VideoUploadTransport = 'multipart' | 'legacy' | 'legacy-fallback'

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
// Same shape across native (expo-bluesky-video-compress probe) and web
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
