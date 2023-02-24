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

export interface CropperOpts {
  path: string
  mediaType?: 'photo'
  width: number
  height: number
  freeStyleCropEnabled?: boolean
  cropperCircleOverlay?: boolean
}

export interface PickedMedia {
  mediaType: 'photo'
  path: string
  mime: string
  size: number
  width: number
  height: number
}
