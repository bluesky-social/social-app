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
    duration: metadata.duration,
  }
}

export function hasWebCodecs(): boolean {
  return false
}
