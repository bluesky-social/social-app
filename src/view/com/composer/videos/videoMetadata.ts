import {type ImagePickerAsset} from 'expo-image-picker'

import {probe} from '../../../../../modules/expo-bluesky-video-compress'

/**
 * Gets video metadata from a uri on native.
 */
export async function getVideoMetadata(
  file: File | string,
): Promise<ImagePickerAsset> {
  if (typeof file !== 'string')
    throw new Error(
      'getVideoMetadata was passed a File, when on native it should be a uri',
    )
  const metadata = await probe(file)
  return {
    uri: file,
    mimeType: metadata.mimeType,
    width: metadata.width,
    height: metadata.height,
    duration: metadata.duration * 1000, // seconds -> ms
  }
}
