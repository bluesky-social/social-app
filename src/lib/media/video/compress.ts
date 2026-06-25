import {type ImagePickerAsset} from 'expo-image-picker'

import {
  SUPPORTED_MIME_TYPES,
  type SupportedMimeTypes,
  VIDEO_MAX_SIZE,
} from '#/lib/constants'
import {logger} from '#/logger'
import {
  compress,
  probe,
  type VideoMetadata,
} from '../../../../modules/expo-bluesky-video-compress'
import {
  COMPRESSION_MAX_DIMENSION,
  COMPRESSION_PASSTHROUGH_BITRATE,
  COMPRESSION_TARGET_BITRATE,
} from './constants'
import {type CompressedVideo} from './types'

export async function compressVideo(
  file: ImagePickerAsset,
  opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
    onProbe?: (metadata: VideoMetadata) => void
  },
): Promise<CompressedVideo> {
  if (file.mimeType === 'image/gif') {
    return {
      uri: file.uri,
      size: file.fileSize ?? -1,
      mimeType: 'image/gif',
      passthroughReason: 'gif',
    }
  }

  const isAcceptableFormat = SUPPORTED_MIME_TYPES.includes(
    file.mimeType as SupportedMimeTypes,
  )

  let metadata
  try {
    metadata = await probe(file.uri)
  } catch (e) {
    logger.debug('probe failed, falling through to passthrough', {
      safeMessage: e,
    })
    return {
      uri: file.uri,
      size: file.fileSize ?? -1,
      mimeType: file.mimeType ?? 'video/mp4',
      passthroughReason: 'compress-error-fallback',
    }
  }

  opts?.onProbe?.(metadata)

  if (!shouldCompress(metadata, isAcceptableFormat)) {
    return {
      uri: file.uri,
      size: metadata.fileSize,
      mimeType: file.mimeType ?? 'video/mp4',
      passthroughReason: 'below-thresholds',
    }
  }

  const result = await compress(
    file.uri,
    {
      targetBitrate: COMPRESSION_TARGET_BITRATE,
      maxSize: COMPRESSION_MAX_DIMENSION,
      codec: 'h264',
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
  metadata: {
    bitrate: number
    width: number
    height: number
    fileSize: number
    isHDR: boolean
  },
  isAcceptableFormat: boolean,
): boolean {
  const maxDimension = Math.max(metadata.width, metadata.height)
  const bitrateKbps = Math.round(metadata.bitrate / 1000)
  const sizeMB = (metadata.fileSize / 1_000_000).toFixed(1)

  if (!isAcceptableFormat) {
    logger.debug('shouldCompress: yes (unsupported format)')
    return true
  }

  // HDR sources need the SDR BT.709 tone-map in the compress path; otherwise we
  // would upload HLG/PQ/Dolby Vision untouched.
  if (metadata.isHDR) {
    logger.debug('shouldCompress: yes (HDR source)')
    return true
  }

  if (metadata.fileSize > VIDEO_MAX_SIZE) {
    logger.debug(`shouldCompress: yes (file too large: ${sizeMB}MB)`)
    return true
  }

  if (
    metadata.bitrate <= COMPRESSION_PASSTHROUGH_BITRATE &&
    maxDimension <= COMPRESSION_MAX_DIMENSION
  ) {
    logger.debug(
      `shouldCompress: no (${bitrateKbps}kbps, ${maxDimension}px, ${sizeMB}MB)`,
    )
    return false
  }

  if (metadata.bitrate > COMPRESSION_PASSTHROUGH_BITRATE) {
    logger.debug(`shouldCompress: yes (bitrate ${bitrateKbps}kbps)`)
  } else {
    logger.debug(`shouldCompress: yes (dimension ${maxDimension}px)`)
  }
  return true
}
