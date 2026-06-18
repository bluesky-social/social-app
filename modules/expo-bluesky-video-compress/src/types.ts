export type CodecPreference = 'auto' | 'hevc' | 'h264'

export type VideoMetadata = {
  width: number
  height: number
  duration: number
  bitrate: number
  fileSize: number
  mimeType: string
  codec: string
  hasAudio: boolean
  frameRate: number
  rotation: number
}

export type CompressOptions = {
  targetBitrate?: number
  maxSize?: number
  codec?: CodecPreference
  frameRateCap?: number
}

export type CompressCallbacks = {
  onProgress?: (progress: number) => void
  signal?: AbortSignal
}

export type CompressResult = {
  uri: string
  size: number
  mimeType: string
  width: number
  height: number
  duration: number
  codec: 'h264' | 'hevc'
}

export type NativeCompressOptions = {
  targetBitrate: number
  maxSize: number
  codec: CodecPreference
  frameRateCap: number
  jobId: number
}
