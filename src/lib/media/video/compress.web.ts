import * as Toast from '#/view/com/util/Toast'

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

  if (blob.size < MAX_VIDEO_SIZE) {
    Toast.show('Videos cannot be larger than 100MB')
    throw new Error('Videos cannot be larger than 100MB')
  }

  return {
    size: blob.size,
    uri: video,
  }
}
