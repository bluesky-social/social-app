import {type ImagePickerAsset} from 'expo-image-picker'

import {SUPPORTED_MIME_TYPES, type SupportedMimeTypes} from '#/lib/constants'
import {compress, probe} from '../../../../modules/expo-bluesky-video-compress'
import {type CompressedVideo} from './types'

// Skip compression if bitrate is at/below this threshold (bps)
const PASSTHROUGH_BITRATE = 3_300_000
// Max dimension that doesn't need downscaling
const PASSTHROUGH_MAX_DIMENSION = 1920
// Max file size the server accepts (bytes)
const MAX_UPLOAD_SIZE = 100 * 1000 * 1000 // 100MB

export async function compressVideo(
  file: ImagePickerAsset,
  opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  if (file.mimeType === 'image/gif') {
    return {uri: file.uri, size: file.fileSize ?? -1, mimeType: 'image/gif'}
  }

  const isAcceptableFormat = SUPPORTED_MIME_TYPES.includes(
    file.mimeType as SupportedMimeTypes,
  )

  // Probe the video to make a smart compression decision
  const metadata = await probe(file.uri)

  const needsCompression = shouldCompress(metadata, isAcceptableFormat)

  if (!needsCompression) {
    return {
      uri: file.uri,
      size: metadata.fileSize,
      mimeType: file.mimeType ?? 'video/mp4',
    }
  }

  const result = await compress(
    file.uri,
    {
      targetBitrate: 3_000_000,
      maxSize: 1920,
    },
    {
      onProgress: opts?.onProgress,
      signal: opts?.signal,
    },
  )

  return {
    uri: result.uri,
    size: result.size,
    mimeType: result.mimeType,
  }
}

function shouldCompress(
  metadata: {bitrate: number; width: number; height: number; fileSize: number},
  isAcceptableFormat: boolean,
): boolean {
  // Always compress unacceptable formats (e.g. MOV → MP4)
  if (!isAcceptableFormat) {
    return true
  }

  // Must compress if over upload limit
  if (metadata.fileSize > MAX_UPLOAD_SIZE) {
    return true
  }

  // Skip if already low bitrate, small resolution, and under upload limit
  const maxDimension = Math.max(metadata.width, metadata.height)
  if (
    metadata.bitrate <= PASSTHROUGH_BITRATE &&
    maxDimension <= PASSTHROUGH_MAX_DIMENSION &&
    metadata.fileSize <= MAX_UPLOAD_SIZE
  ) {
    return false
  }

  return true
}
