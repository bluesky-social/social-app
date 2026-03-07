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

export type ImageSaveFormat = 'jpeg' | 'webp' | 'png'

const FORMAT_TO_EXT: Record<ImageSaveFormat, string> = {
  jpeg: '.jpg',
  webp: '.webp',
  png: '.png',
}

export function extForFormat(format: ImageSaveFormat): string {
  return FORMAT_TO_EXT[format]
}

/**
 * Appends a @format suffix to CDN URLs to request a specific image format.
 * CDN URLs end with @jpeg, @webp, @png, or no extension (which may default to webp).
 */
export function cdnUriWithFormat(
  uri: string,
  format: ImageSaveFormat,
): string {
  return uri.replace(/(@[a-z]{3,5})?$/, `@${format}`)
}
