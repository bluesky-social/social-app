import {getVideoMetaData, Video} from 'react-native-compressor'
import * as FileSystem from 'expo-file-system'

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

  await FileSystem.deleteAsync(file)
  const info = await getVideoMetaData(compressed)
  console.log('compressed size', (info.size / 1024).toFixed(2) + 'mb')
  console.log(JSON.stringify(info, null, 2))

  return {uri: compressed, size: info.size}
}
