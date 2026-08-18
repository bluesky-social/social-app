import {type ImagePickerAsset} from 'expo-image-picker'
import {compress, probe, type VideoMetadata} from '@bsky.app/video-compressor'

import {SUPPORTED_MIME_TYPES, type SupportedMimeTypes} from '#/lib/constants'
import {logger} from '#/logger'
import {
  COMPRESSION_MAX_DIMENSION,
  COMPRESSION_TARGET_BITRATE,
} from './constants'
import {type CompressedVideo, type ProbedMetadata} from './types'

const MIN_SIZE_FOR_COMPRESSION_BYTES = 25 * 1024 * 1024 // 25mb

export async function compressVideo(
  file: ImagePickerAsset,
  opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
    onProbe?: (metadata: ProbedMetadata) => void
  },
): Promise<CompressedVideo> {
  const {onProgress, signal, onProbe} = opts || {}

  // Probe data is purely informational - fired into telemetry to validate
  // future smart-skip thresholds. Failures must not block the upload.
  if (onProbe && file.mimeType !== 'image/gif') {
    try {
      onProbe(toProbedMetadata(await probe(file.uri)))
    } catch (e) {
      logger.debug('video probe failed', {safeMessage: e})
    }
  }

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
      passthroughReason: 'below-byte-threshold',
    }
  }

  return compress(
    file.uri,
    {
      targetBitrate: COMPRESSION_TARGET_BITRATE,
      maxSize: COMPRESSION_MAX_DIMENSION,
      codec: 'auto',
      frameRateCap: 30,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      // Force a transcode for unacceptable-format files regardless of size.
      // The compressor's default threshold would otherwise pass small
      // unacceptable-format files through unchanged and the server would
      // reject them. Acceptable formats are already short-circuited above so
      // they never reach this call.
      passthroughBelowBytes: 0,
      passthroughGif: false,
    },
    {onProgress, signal},
  )
}

function toProbedMetadata(metadata: VideoMetadata): ProbedMetadata {
  return metadata
}
