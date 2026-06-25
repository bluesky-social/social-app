import {getVideoMetaData, Video} from 'react-native-compressor'
import {type ImagePickerAsset} from 'expo-image-picker'

import {SUPPORTED_MIME_TYPES, type SupportedMimeTypes} from '#/lib/constants'
import {type CompressedVideo} from './types'
import {extToMime} from './util'

const MIN_SIZE_FOR_COMPRESSION_BYTES = 25 * 1024 * 1024 // 25mb

export async function compressVideo(
  file: ImagePickerAsset,
  opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  const {onProgress, signal} = opts || {}

  if (file.mimeType === 'image/gif') {
    // let's hope they're small enough that they don't need compression!
    // this compression library doesn't support gifs
    // worst case - server rejects them. I think that's fine -sfn
    return {
      uri: file.uri,
      size: file.fileSize ?? -1,
      mimeType: 'image/gif',
      passthroughReason: 'gif',
    }
  }

  // Pre-check the threshold ourselves so we can label the skip in telemetry.
  // rnc would do the same skip internally via minimumFileSizeForCompress, but
  // that path is invisible to us.
  const isAcceptableFormat = SUPPORTED_MIME_TYPES.includes(
    file.mimeType as SupportedMimeTypes,
  )
  if (
    isAcceptableFormat &&
    file.fileSize != null &&
    file.fileSize < MIN_SIZE_FOR_COMPRESSION_BYTES
  ) {
    return {
      uri: file.uri,
      size: file.fileSize,
      mimeType: file.mimeType ?? 'video/mp4',
      passthroughReason: 'below-threshold',
    }
  }

  const compressed = await Video.compress(
    file.uri,
    {
      compressionMethod: 'manual',
      bitrate: 3_000_000, // 3mbps
      maxSize: 1920,
      getCancellationId: id => {
        if (signal) {
          signal.addEventListener('abort', () => {
            Video.cancelCompression(id)
          })
        }
      },
    },
    onProgress,
  )

  const info = await getVideoMetaData(compressed)

  return {uri: compressed, size: info.size, mimeType: extToMime(info.extension)}
}
