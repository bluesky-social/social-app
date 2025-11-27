import {type ImagePickerAsset} from 'expo-image-picker'

export const getVideoMetadata = (_file: File): Promise<ImagePickerAsset> => {
  throw new Error('getVideoMetadata is web only')
}

export function hasWebCodecs(): boolean {
  throw new Error("hasWebCodecs is web only (also, no it doesn't)")
}
