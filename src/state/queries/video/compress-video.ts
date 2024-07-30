import {ImagePickerAsset} from 'expo-image-picker'
import {useMutation} from '@tanstack/react-query'

import {CompressedVideo, compressVideo} from 'lib/media/video/compress'

export function useCompressVideoMutation({
  onProgress,
  onSuccess,
  onError,
}: {
  onProgress: (progress: number) => void
  onError: (e: any) => void
  onSuccess: (video: CompressedVideo) => void
}) {
  return useMutation({
    mutationFn: async (asset: ImagePickerAsset) => {
      return await compressVideo(asset.uri, {
        onProgress: num => onProgress(trunc2dp(num)),
      })
    },
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
