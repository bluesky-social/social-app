import {ImagePickerAsset} from 'expo-image-picker'

import {VideoTooLargeError} from 'lib/media/video/errors'
import {CompressedVideo} from './types'

const MAX_VIDEO_SIZE = 1024 * 1024 * 50 // 50mb

// doesn't actually compress, converts to ArrayBuffer
export async function compressVideo(
  asset: ImagePickerAsset,
  _opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  const {mimeType, base64} = parseDataUrl(asset.uri)
  const blob = base64ToBlob(base64, mimeType)
  const uri = URL.createObjectURL(blob)

  if (blob.size > MAX_VIDEO_SIZE) {
    throw new VideoTooLargeError()
  }

  return {
    size: blob.size,
    uri,
    bytes: await blob.arrayBuffer(),
    mimeType,
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

    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  return new Blob(byteArrays, {type: mimeType})
}
