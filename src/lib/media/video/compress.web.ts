import {type ImagePickerAsset} from 'expo-image-picker'

import {VIDEO_MAX_SIZE} from '#/lib/constants'
import {VideoTooLargeError} from '#/lib/media/video/errors'
import {type CompressedVideo} from './types'

// doesn't actually compress, just reads the File bytes
export async function compressVideo(
  asset: ImagePickerAsset,
  _opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  let bytes: ArrayBuffer
  if (asset.file) {
    bytes = await asset.file.arrayBuffer()
  } else {
    // fallback: fetch from blob/object URL
    bytes = await fetch(asset.uri).then(res => res.arrayBuffer())
  }

  if (bytes.byteLength > VIDEO_MAX_SIZE) {
    throw new VideoTooLargeError()
  }

  const mimeType = asset.mimeType ?? asset.file?.type ?? 'video/mp4'

  return {
    size: bytes.byteLength,
    uri: asset.uri,
    bytes,
    mimeType,
  }
}
