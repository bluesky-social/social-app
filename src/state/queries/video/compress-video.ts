import {ImagePickerAsset} from 'expo-image-picker'
import {useMutation} from '@tanstack/react-query'

import {cancelable} from '#/lib/async/cancelable'
import {CompressedVideo} from '#/lib/media/video/types'
import {compressVideo} from 'lib/media/video/compress'

export function useCompressVideoMutation({
  onProgress,
  onSuccess,
  onError,
  signal,
}: {
  onProgress: (progress: number) => void
  onError: (e: any) => void
  onSuccess: (video: CompressedVideo) => void
  signal: AbortSignal
}) {
  return useMutation({
    mutationKey: ['video', 'compress'],
    mutationFn: cancelable(
      (asset: ImagePickerAsset) =>
        compressVideo(asset, {
          onProgress: num => onProgress(trunc2dp(num)),
          signal,
        }),
      signal,
    ),
    onError,
    onSuccess,
    onMutate: () => {
      onProgress(0)
    },
  })
}

function trunc2dp(num: number) {
  return Math.trunc(num * 100) / 100
}
