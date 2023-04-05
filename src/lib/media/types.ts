import {Image as RNImage, openCropper} from 'react-native-image-crop-picker'

export interface Dimensions {
  width: number
  height: number
}

export interface PickerOpts {
  mediaType?: 'photo'
  multiple?: boolean
  maxFiles?: number
}

export interface CameraOpts {
  mediaType?: 'photo'
  width: number
  height: number
  freeStyleCropEnabled?: boolean
  cropperCircleOverlay?: boolean
}

export type CropperOptions = Parameters<typeof openCropper>[0]

export type Image = RNImage & {
  mediaType: 'photo'
}

type SelectedPhotoOriginal = {
  original: Image
}

export type SelectedPhoto =
  | SelectedPhotoOriginal
  | (SelectedPhotoOriginal & {
      cropped: Image
    })
