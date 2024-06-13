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
) {
  const {onProgress, getCancellationId} = opts || {}

  try {
    const compressed = await Video.compress(
      file,
      {
        getCancellationId,
        compressionMethod: 'auto',
        maxSize: 1920,
      },
      onProgress,
    )

    await FileSystem.deleteAsync(file)
    const info = await getVideoMetaData(compressed)
    console.log('compressed size', (info.size / 1024 / 1024).toFixed(2) + 'mb')
    console.log(JSON.stringify(info, null, 2))

    return {
      success: true,
      video: {uri: compressed, size: info.size} as CompressedVideo,
    }
  } catch (error) {
    console.error('compressVideo error', error)
    return {success: false}
  }
}
