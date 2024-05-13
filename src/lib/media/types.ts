import {openCropper} from 'react-native-image-crop-picker'

export interface Dimensions {
  width: number
  height: number
}

export interface PickerOpts {
  mediaType?: string
  multiple?: boolean
  maxFiles?: number
}

export interface CameraOpts {
  width: number
  height: number
  freeStyleCropEnabled?: boolean
  cropperCircleOverlay?: boolean
}

export type CropperOptions = Parameters<typeof openCropper>[0] & {
  webAspectRatio?: number
  webCircularCrop?: boolean
}
