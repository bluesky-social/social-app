import {type ImagePickerAsset} from 'expo-image-picker'

import {SUPPORTED_MIME_TYPES, type SupportedMimeTypes} from '#/lib/constants'
import {logger} from '#/logger'
import {compress, probe} from '../../../../modules/expo-bluesky-video-compress'
import {type CompressedVideo} from './types'

// Skip compression if bitrate is at/below this threshold (bps)
const PASSTHROUGH_BITRATE = 5_000_000
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
  const maxDimension = Math.max(metadata.width, metadata.height)
  const bitrateKbps = Math.round(metadata.bitrate / 1000)
  const sizeMB = (metadata.fileSize / 1_000_000).toFixed(1)

  // Always compress unacceptable formats (e.g. MOV → MP4)
  if (!isAcceptableFormat) {
    logger.debug('shouldCompress: yes (unsupported format)')
    return true
  }

  // Must compress if over upload limit
  if (metadata.fileSize > MAX_UPLOAD_SIZE) {
    logger.debug(`shouldCompress: yes (file too large: ${sizeMB}MB)`)
    return true
  }

  // Skip if already low bitrate, small resolution, and under upload limit
  if (
    metadata.bitrate <= PASSTHROUGH_BITRATE &&
    maxDimension <= PASSTHROUGH_MAX_DIMENSION
  ) {
    logger.debug(
      `shouldCompress: no (${bitrateKbps}kbps, ${maxDimension}px, ${sizeMB}MB)`,
    )
    return false
  }

  if (metadata.bitrate > PASSTHROUGH_BITRATE) {
    logger.debug(
      `shouldCompress: yes (bitrate ${bitrateKbps}kbps > ${PASSTHROUGH_BITRATE / 1000}kbps)`,
    )
  } else {
    logger.debug(
      `shouldCompress: yes (dimension ${maxDimension}px > ${PASSTHROUGH_MAX_DIMENSION}px)`,
    )
  }
  return true
}
