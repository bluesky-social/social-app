import {type ImagePickerAsset} from 'expo-image-picker'

import {VIDEO_MAX_SIZE} from '#/lib/constants'
import {VideoTooLargeError} from '#/lib/media/video/errors'
import {type CompressedVideo} from './types'

export async function compressVideo(
  asset: ImagePickerAsset,
  _opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  // Legacy path: caller passed a data URL (draft restore, paste, etc.).
  if (asset.uri.startsWith('data:')) {
    const {mimeType, base64} = parseDataUrl(asset.uri)
    const blob = base64ToBlob(base64, mimeType)
    if (blob.size > VIDEO_MAX_SIZE) {
      throw new VideoTooLargeError()
    }
    return {
      size: blob.size,
      uri: URL.createObjectURL(blob),
      mimeType,
    }
  }

  const res = await fetch(asset.uri)
  const blob = await res.blob()
  if (blob.size > VIDEO_MAX_SIZE) {
    throw new VideoTooLargeError()
  }
  return {
    size: blob.size,
    uri: asset.uri,
    mimeType: blob.type || asset.mimeType || 'video/mp4',
  }
}

function parseDataUrl(dataUrl: string) {
  const [mimeType, base64] = dataUrl.slice('data:'.length).split(';base64,')
  if (!mimeType || !base64) {
    throw new Error('Invalid data URL')
  }
  return {mimeType, base64}
}

function base64ToBlob(base64: string, mimeType: string) {
  const byteCharacters = atob(base64)
  const byteArrays = []
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    byteArrays.push(new Uint8Array(byteNumbers))
  }
  return new Blob(byteArrays, {type: mimeType})
}
