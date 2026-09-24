import {type ImagePickerAsset} from 'expo-image-picker'
import {probe} from '@bsky.app/video-compressor'

import {extToMime} from '#/lib/media/video/util'

export async function getVideoMetadata(
  file: File | string,
  fallbackMimeType?: string,
): Promise<ImagePickerAsset> {
  if (typeof file !== 'string')
    throw new Error(
      'getVideoMetadata was passed a File, when on native it should be a uri',
    )
  const metadata = await probe(file)
  return {
    uri: file,
    mimeType: getMimeTypeFromUri(file) ?? fallbackMimeType ?? metadata.mimeType,
    fileSize: metadata.fileSize,
    width: metadata.width,
    height: metadata.height,
    /*
     * The probe reports seconds; `ImagePickerAsset.duration` uses milliseconds.
     */
    duration: metadata.duration * 1000,
  }
}

function getMimeTypeFromUri(uri: string): string | undefined {
  const extension = uri.match(/\.([^.?#/]+)(?:[?#]|$)/)?.[1]
  if (!extension) return

  try {
    return extToMime(extension)
  } catch {
    return
  }
}

export function hasWebCodecs(): boolean {
  return false
}
