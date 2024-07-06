import {VideoTooLargeError} from 'lib/media/video/errors'

const MAX_VIDEO_SIZE = 1024 * 1024 * 100 // 100MB

export type CompressedVideo = {
  uri: string
  size: number
}

// doesn't actually compress, but throws if >100MB
export async function compressVideo(
  file: string,
  _callbacks?: {
    onProgress: (progress: number) => void
  },
): Promise<CompressedVideo> {
  const blob = await fetch(file).then(res => res.blob())
  const video = URL.createObjectURL(blob)

  if (blob.size > MAX_VIDEO_SIZE) {
    throw new VideoTooLargeError()
  }

  return {
    size: blob.size,
    uri: video,
  }
}
