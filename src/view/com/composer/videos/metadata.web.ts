import {type ImagePickerAsset} from 'expo-image-picker'
import {ALL_FORMATS, BlobSource, Input} from 'mediabunny'

import {logger} from '#/logger'

export function hasWebCodecs(): boolean {
  return (
    typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined'
  )
}

export async function getVideoMetadata(file: File): Promise<ImagePickerAsset> {
  const blobUrl = URL.createObjectURL(file)

  logger.debug('metadata: starting', {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    hasWebCodecs: hasWebCodecs(),
  })

  if (hasWebCodecs()) {
    try {
      const result = await getMetadataWithWebCodecs(file, blobUrl)
      logger.debug('metadata: MediaBunny succeeded', {
        width: result.width,
        height: result.height,
        duration: result.duration,
      })
      return result
    } catch (e) {
      logger.warn('metadata: MediaBunny failed, using fallback', {
        safeMessage: e,
      })
    }
  }

  // Fallback to old-fashioned browser APIs
  const result = await getMetadataWithBrowserAPIs(file, blobUrl)
  logger.debug('metadata: browser API succeeded', {
    width: result.width,
    height: result.height,
    duration: result.duration,
  })
  return result
}

async function getMetadataWithWebCodecs(
  file: File,
  blobUrl: string,
): Promise<ImagePickerAsset> {
  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  })

  try {
    const [videoTrack, duration] = await Promise.all([
      input.getPrimaryVideoTrack(),
      input.computeDuration(),
    ])

    if (!videoTrack) {
      throw new Error('No video track found')
    }

    return {
      uri: blobUrl,
      mimeType: file.type,
      width: videoTrack.displayWidth,
      height: videoTrack.displayHeight,
      duration: duration * 1000, // convert seconds to ms
    }
  } finally {
    input.dispose()
  }
}

async function getMetadataWithBrowserAPIs(
  file: File,
  blobUrl: string,
): Promise<ImagePickerAsset> {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/gif') {
      const img = new Image()
      img.onload = () => {
        resolve({
          uri: blobUrl,
          mimeType: 'image/gif',
          width: img.width,
          height: img.height,
          duration: null,
        })
      }
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl)
        reject(new Error('Failed to load GIF'))
      }
      img.src = blobUrl
    } else {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = blobUrl

      video.onloadedmetadata = () => {
        resolve({
          uri: blobUrl,
          mimeType: file.type,
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration * 1000,
        })
      }
      video.onerror = () => {
        URL.revokeObjectURL(blobUrl)
        reject(new Error('Failed to load video metadata'))
      }
    }
  })
}
