import {type ImagePickerAsset} from 'expo-image-picker'

export const getVideoMetadata = (_file: File): Promise<ImagePickerAsset> => {
  throw new Error('getVideoMetadata is web only')
}

export function hasWebCodecs(): boolean {
  return false
}
