import {type ImagePickerAsset} from 'expo-image-picker'
import {
  ALL_FORMATS,
  type AudioCodec,
  BlobSource,
  BufferTarget,
  canEncodeAudio,
  canEncodeVideo,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  type VideoCodec,
  WebMOutputFormat,
} from 'mediabunny'

import {VIDEO_MAX_SIZE} from '#/lib/constants'
import {VideoTooLargeError} from '#/lib/media/video/errors'
import {logger} from '#/logger'
import {hasWebCodecs} from '#/view/com/composer/videos/metadata'
import {type CompressedVideo} from './types'

const TARGET_BITRATE = 3_000_000 // 3mbps, matches native
const MAX_DIMENSION = 1920 // matches native
const MIN_SIZE_FOR_COMPRESSION = 25 * 1000 * 1000 // 25mb, matches native

// Codecs to try in order of preference
// avc (H.264) is most compatible, vp9/vp8 are fallbacks for WebM
const VIDEO_CODECS: VideoCodec[] = ['avc', 'hevc', 'vp9', 'vp8']

export async function compressVideo(
  asset: ImagePickerAsset,
  opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  const {onProgress, signal} = opts || {}

  logger.debug('compress: starting', {
    uri: asset.uri.slice(0, 50),
    hasWebCodecs: hasWebCodecs(),
  })

  const response = await fetch(asset.uri)
  const blob = await response.blob()

  const isGif = blob.type === 'image/gif'

  logger.debug('compress: fetched blob', {
    size: blob.size,
    mimeType: blob.type,
    isGif,
    minSizeForCompression: MIN_SIZE_FOR_COMPRESSION,
  })

  // Try MediaBunny compression if WebCodecs is available and file is large enough
  // Skip GIFs - MediaBunny doesn't support them
  if (hasWebCodecs() && blob.size >= MIN_SIZE_FOR_COMPRESSION && !isGif) {
    try {
      return await doCompression(blob, asset.uri, {onProgress, signal})
    } catch (e) {
      logger.warn('compress: MediaBunny compression failed, using original', {
        safeMessage: e,
      })
    }
  } else {
    logger.debug('compress: skipping compression', {
      hasWebCodecs: hasWebCodecs(),
      blobSize: blob.size,
      minSize: MIN_SIZE_FOR_COMPRESSION,
    })
  }

  // No compression path - just return the blob as-is
  if (blob.size > VIDEO_MAX_SIZE) {
    throw new VideoTooLargeError()
  }

  return {
    uri: asset.uri,
    size: blob.size,
    bytes: await blob.arrayBuffer(),
    mimeType: blob.type || 'video/mp4',
  }
}

async function findEncodableVideoCodec(
  width: number,
  height: number,
): Promise<{codec: VideoCodec; useWebM: boolean} | null> {
  for (const codec of VIDEO_CODECS) {
    const canEncode = await canEncodeVideo(codec, {
      width,
      height,
      bitrate: TARGET_BITRATE,
    })
    logger.debug('compress: checking video codec', {
      codec,
      canEncode,
      width,
      height,
    })
    if (canEncode) {
      // vp8/vp9 need WebM container, others use MP4
      const useWebM = codec === 'vp8' || codec === 'vp9'
      return {codec, useWebM}
    }
  }
  return null
}

// Audio codecs to try - aac for MP4, opus for WebM
const AUDIO_CODECS_MP4: AudioCodec[] = ['aac']
const AUDIO_CODECS_WEBM: AudioCodec[] = ['opus', 'vorbis']

async function findEncodableAudioCodec(
  audioTrack: Awaited<ReturnType<Input['getPrimaryAudioTrack']>>,
  useWebM: boolean,
): Promise<{codec: AudioCodec} | null> {
  if (!audioTrack) {
    return null
  }

  // First check if we can decode the source audio
  const canDecodeSource = await audioTrack.canDecode()
  logger.debug('compress: checking audio source', {
    sourceCodec: audioTrack.codec,
    canDecode: canDecodeSource,
    channels: audioTrack.numberOfChannels,
    sampleRate: audioTrack.sampleRate,
  })

  if (!canDecodeSource) {
    return null
  }

  const codecsToTry = useWebM ? AUDIO_CODECS_WEBM : AUDIO_CODECS_MP4

  for (const codec of codecsToTry) {
    const canEncode = await canEncodeAudio(codec, {
      numberOfChannels: audioTrack.numberOfChannels,
      sampleRate: audioTrack.sampleRate,
    })
    logger.debug('compress: checking audio encode codec', {
      codec,
      canEncode,
    })
    if (canEncode) {
      return {codec}
    }
  }

  return null
}

async function doCompression(
  blob: Blob,
  originalUri: string,
  opts: {
    onProgress?: (progress: number) => void
    signal?: AbortSignal
  },
): Promise<CompressedVideo> {
  const {onProgress, signal} = opts

  const input = new Input({
    source: new BlobSource(blob),
    formats: ALL_FORMATS,
  })

  // Get video track to determine dimensions for codec check
  const videoTrack = await input.getPrimaryVideoTrack()
  if (!videoTrack) {
    input.dispose()
    throw new Error('No video track found')
  }

  // Get audio track to check if we can encode it
  const audioTrack = await input.getPrimaryAudioTrack()

  const {width, height} = calculateDimensions(
    videoTrack.displayWidth,
    videoTrack.displayHeight,
    MAX_DIMENSION,
  )

  logger.debug('compress: video dimensions', {
    original: {
      width: videoTrack.displayWidth,
      height: videoTrack.displayHeight,
    },
    target: {width, height},
    audioCodec: audioTrack?.codec,
  })

  // Find a video codec we can encode with
  const codecInfo = await findEncodableVideoCodec(width, height)
  if (!codecInfo) {
    input.dispose()
    throw new Error('No supported video codec available')
  }

  // Check if we can encode the audio
  const audioCodecInfo = await findEncodableAudioCodec(
    audioTrack,
    codecInfo.useWebM,
  )

  logger.debug('compress: using codecs', {
    video: codecInfo.codec,
    audio: audioCodecInfo?.codec ?? 'none',
    useWebM: codecInfo.useWebM,
  })

  const target = new BufferTarget()
  const output = new Output({
    format: codecInfo.useWebM ? new WebMOutputFormat() : new Mp4OutputFormat(),
    target,
  })

  // If we have audio but can't encode it, bail out and use the original
  if (audioTrack && !audioCodecInfo) {
    input.dispose()
    throw new Error(
      `Cannot encode audio codec: ${audioTrack.codec ?? 'unknown'}`,
    )
  }

  const conversion = await Conversion.init({
    input,
    output,
    video: {
      codec: codecInfo.codec,
      bitrate: TARGET_BITRATE,
      width,
      height,
      fit: 'contain',
    },
    audio: audioCodecInfo ? {codec: audioCodecInfo.codec} : undefined,
  })

  if (onProgress) {
    conversion.onProgress = onProgress
  }

  if (signal) {
    signal.addEventListener(
      'abort',
      () => {
        logger.debug('compress: cancelled')
        conversion.cancel()
      },
      {once: true},
    )
  }

  logger.debug('compress: starting conversion')
  const startTime = performance.now()

  try {
    await conversion.execute()
  } finally {
    input.dispose()
  }

  const elapsed = performance.now() - startTime
  const bytes = target.buffer

  if (!bytes) {
    throw new Error('MediaBunny compression produced no output')
  }

  const mimeType = codecInfo.useWebM ? 'video/webm' : 'video/mp4'

  const savedBytes = blob.size - bytes.byteLength
  const savedPercent = ((savedBytes / blob.size) * 100).toFixed(1)

  logger.debug('compress: completed', {
    from: blob.type,
    to: mimeType,
    originalSize: blob.size,
    compressedSize: bytes.byteLength,
    savedBytes,
    savedPercent: `${savedPercent}%`,
    elapsedMs: Math.round(elapsed),
  })

  if (bytes.byteLength > VIDEO_MAX_SIZE) {
    throw new VideoTooLargeError()
  }

  return {
    uri: originalUri,
    size: bytes.byteLength,
    bytes,
    mimeType,
  }
}

function calculateDimensions(
  width: number,
  height: number,
  maxDimension: number,
): {width: number; height: number} {
  const maxSide = Math.max(width, height)
  if (maxSide <= maxDimension) {
    return {width, height}
  }

  const scale = maxDimension / maxSide
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}
