import {type ImagePickerAsset} from 'expo-image-picker'

import {type CompressedVideo} from './types'

// Toggle for A/B comparison. Set to true to use the new Expo module.
const USE_NEW_COMPRESSOR = false

export async function compressVideo(
  file: ImagePickerAsset,
  opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  if (USE_NEW_COMPRESSOR) {
    const {compressVideo: compressVideoNew} = await import('./compress.new')
    return compressVideoNew(file, opts)
  } else {
    const {compressVideo: compressVideoLegacy} = await import(
      './compress.legacy'
    )
    return compressVideoLegacy(file, opts)
  }
}
