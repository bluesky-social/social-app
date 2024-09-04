export type CompressedVideo = {
  uri: string
  mimeType: string
  size: number
  // web only, can fall back to uri if missing
  bytes?: ArrayBuffer
}
