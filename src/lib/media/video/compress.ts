import {type ImagePickerAsset} from 'expo-image-picker'

import {SUPPORTED_MIME_TYPES, type SupportedMimeTypes} from '#/lib/constants'
import {logger} from '#/logger'
import {compress, probe} from '../../../../modules/expo-bluesky-video-compress'
import {type CompressedVideo} from './types'

const PASSTHROUGH_BITRATE = 5_000_000
const PASSTHROUGH_MAX_DIMENSION = 1920
const MAX_UPLOAD_SIZE = 100 * 1000 * 1000

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

  const metadata = await probe(file.uri)

  if (!shouldCompress(metadata, isAcceptableFormat)) {
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
      maxSize: PASSTHROUGH_MAX_DIMENSION,
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
  metadata: {bitrate: number; width: number; height: number; fileSize: number},
  isAcceptableFormat: boolean,
): boolean {
  const maxDimension = Math.max(metadata.width, metadata.height)
  const bitrateKbps = Math.round(metadata.bitrate / 1000)
  const sizeMB = (metadata.fileSize / 1_000_000).toFixed(1)

  if (!isAcceptableFormat) {
    logger.debug('shouldCompress: yes (unsupported format)')
    return true
  }

  if (metadata.fileSize > MAX_UPLOAD_SIZE) {
    logger.debug(`shouldCompress: yes (file too large: ${sizeMB}MB)`)
    return true
  }

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
    logger.debug(`shouldCompress: yes (bitrate ${bitrateKbps}kbps)`)
  } else {
    logger.debug(`shouldCompress: yes (dimension ${maxDimension}px)`)
  }
  return true
}
