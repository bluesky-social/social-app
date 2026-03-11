import {type ImagePickerAsset} from 'expo-image-picker'

import * as Toast from '#/components/Toast'
import {IS_DEV} from '#/env'
import {type CompressedVideo} from './types'

// Toggle for A/B comparison. Set to true to use the new Expo module.
const USE_NEW_COMPRESSOR = false

// In dev, run both compressors and show a comparison toast.
const DEV_COMPARE_BOTH = true

export async function compressVideo(
  file: ImagePickerAsset,
  opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  if (IS_DEV && DEV_COMPARE_BOTH) {
    return compressAndCompare(file, opts)
  }

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

async function compressAndCompare(
  file: ImagePickerAsset,
  opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  const {compressVideo: compressVideoLegacy} = await import('./compress.legacy')
  const {compressVideo: compressVideoNew} = await import('./compress.new')

  // Run legacy first (progress goes to UI)
  const legacyStart = performance.now()
  const legacyResult = await compressVideoLegacy(file, opts)
  const legacyMs = performance.now() - legacyStart

  // Run new second
  const newStart = performance.now()
  const newResult = await compressVideoNew(file, opts)
  const newMs = performance.now() - newStart

  const fmt = (ms: number, size: number) =>
    `${(ms / 1000).toFixed(1)}s → ${(size / 1_000_000).toFixed(1)}MB`

  Toast.show(
    `legacy: ${fmt(legacyMs, legacyResult.size)}\nnew: ${fmt(newMs, newResult.size)}`,
    {duration: 8000},
  )

  // Return whichever is selected
  return USE_NEW_COMPRESSOR ? newResult : legacyResult
}
