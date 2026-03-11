export type VideoMetadata = {
  width: number
  height: number
  duration: number // seconds
  bitrate: number // bps
  fileSize: number // bytes
  mimeType: string
  codec: string
  hasAudio: boolean
  frameRate: number
  rotation: number
}

export type CompressOptions = {
  targetBitrate: number // bps (e.g. 3_000_000)
  maxSize: number // max dimension in pixels (e.g. 1920)
}

export type CompressResult = {
  uri: string
  size: number
  mimeType: string
  width: number
  height: number
  duration: number
}

export type NativeCompressOptions = CompressOptions & {jobId: number}
