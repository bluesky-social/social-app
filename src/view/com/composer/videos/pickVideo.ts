import {getVideoMetaData} from 'react-native-compressor'
import {
  type ImagePickerAsset,
  launchImageLibraryAsync,
  UIImagePickerPreferredAssetRepresentationMode,
} from 'expo-image-picker'

import {VIDEO_MAX_DURATION_MS} from '#/lib/constants'
import {extToMime} from '#/lib/media/video/util'

export async function pickVideo() {
  return await launchImageLibraryAsync({
    exif: false,
    mediaTypes: ['videos'],
    quality: 1,
    legacy: true,
    preferredAssetRepresentationMode:
      UIImagePickerPreferredAssetRepresentationMode.Current,
    videoMaxDuration: VIDEO_MAX_DURATION_MS / 1000,
  })
}

/**
 * Gets video metadata from a file or uri, depending on the platform
 *
 * @param file File on web, uri on native
 */
export async function getVideoMetadata(
  file: File | string,
): Promise<ImagePickerAsset> {
  if (typeof file !== 'string')
    throw new Error(
      'getVideoMetadata was passed a File, when on native it should be a uri',
    )
  const metadata = await getVideoMetaData(file)
  return {
    uri: file,
    mimeType: extToMime(metadata.extension),
    width: metadata.width,
    height: metadata.height,
    duration: metadata.duration,
  }
}
