import {useState} from 'react'
import {ImagePickerAsset} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {compressVideo} from '#/lib/media/video/compress'

export function useVideoState({setError}: {setError: (error: string) => void}) {
  const {_} = useLingui()
  const [progress, setProgress] = useState(0)

  const {mutate, data, isPending, isError, reset, variables} = useMutation({
    mutationFn: async (asset: ImagePickerAsset) => {
      const compressed = await compressVideo(asset.uri, {
        onProgress: num => setProgress(trunc2dp(num)),
      })

      return compressed
    },
    onError: () => {
      setError(_(msg`Could not compress video`))
    },
    onMutate: () => {
      setProgress(0)
    },
  })

  return {
    video: data,
    onSelectVideo: mutate,
    videoPending: isPending,
    videoProcessingData: variables,
    videoError: isError,
    clearVideo: reset,
    videoProcessingProgress: progress,
  }
}

function trunc2dp(num: number) {
  return Math.trunc(num * 100) / 100
}
