import {
  ImagePickerAsset,
  launchImageLibraryAsync,
  MediaTypeOptions,
  UIImagePickerPreferredAssetRepresentationMode,
} from 'expo-image-picker'

export async function pickVideo() {
  return await launchImageLibraryAsync({
    exif: false,
    mediaTypes: MediaTypeOptions.Videos,
    quality: 1,
    legacy: true,
    preferredAssetRepresentationMode:
      UIImagePickerPreferredAssetRepresentationMode.Current,
  })
}

export const getVideoMetadata = (_file: File): Promise<ImagePickerAsset> => {
  throw new Error('getVideoMetadata is web only')
}
