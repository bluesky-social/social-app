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
