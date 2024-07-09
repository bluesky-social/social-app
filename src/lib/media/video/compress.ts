import {getVideoMetaData, Video} from 'react-native-compressor'

export type CompressedVideo = {
  uri: string
  size: number
}

export async function compressVideo(
  file: string,
  opts?: {
    getCancellationId?: (id: string) => void
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  const {onProgress, getCancellationId} = opts || {}

  const compressed = await Video.compress(
    file,
    {
      getCancellationId,
      compressionMethod: 'manual',
      bitrate: 3_000_000, // 3mbps
      maxSize: 1920,
    },
    onProgress,
  )

  const info = await getVideoMetaData(compressed)
  return {uri: compressed, size: info.size}
}
