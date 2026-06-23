export type CompressedVideo = {
  uri: string
  mimeType: string
  size: number
  // web only, can fall back to uri if missing
  bytes?: ArrayBuffer
  // Set when the engine returned the input unchanged. Undefined means the
  // bytes were actually re-encoded. Used by telemetry to split
  // compressCompleted vs compressSkipped, and to label the skip reason.
  passthroughReason?:
    | 'gif'
    | 'probe-failed'
    | 'below-threshold'
    | 'web-passthrough'
}
