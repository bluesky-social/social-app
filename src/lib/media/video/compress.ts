import {getVideoMetaData, Video} from 'react-native-compressor'

export type CompressedVideo = {
  uri: string
  size: number
}

export async function compressVideo(
  file: string,
  opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  const {onProgress, signal} = opts || {}

  const compressed = await Video.compress(
    file,
    {
      compressionMethod: 'manual',
      bitrate: 3_000_000, // 3mbps
      maxSize: 1920,
      getCancellationId: id => {
        if (signal) {
          signal.addEventListener('abort', () => {
            console.log('cancelling video', id)
            Video.cancelCompression(id)
          })
        }
      },
    },
    onProgress,
  )

  const info = await getVideoMetaData(compressed)
  return {uri: compressed, size: info.size}
}
