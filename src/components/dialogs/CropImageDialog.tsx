import React, {useCallback, useRef} from 'react'
import {Image as RNImage} from 'react-native-image-crop-picker'

import {openCropperNative} from '#/lib/media/picker'
import {CropperOptions} from '#/lib/media/types'

export type CropImage = (opts: CropperOptions) => Promise<RNImage>
type CropImageCallback = (
  opts: CropperOptions,
  onComplete: CropperCallback,
) => void
type CropperCallback = (image: RNImage | null) => unknown

export function useImageCropperControl(): [
  ref: React.Ref<{openCropper: CropImageCallback}>,
  crop: CropImage,
] {
  const ref = useRef<{openCropper: CropImageCallback}>(null)
  const crop = useCallback((opts: CropperOptions) => {
    return openCropperNative(opts)
  }, [])
  return [ref, crop] as const
}

export function CropImageDialog({}: {
  controlRef: React.Ref<{openCropper: CropImageCallback}>
}) {
  // web only
  return null
}
