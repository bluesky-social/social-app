import {getVideoMetaData} from 'react-native-compressor'
import {type ImagePickerAsset} from 'expo-image-picker'

import {extToMime} from '#/lib/media/video/util'

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
    /*
     * react-native-compressor reports seconds; the rest of the app treats
     * `ImagePickerAsset.duration` as milliseconds (matching expo-image-picker).
     */
    duration: metadata.duration * 1000,
  }
}

export function hasWebCodecs(): boolean {
  return false
}
