import {useState} from 'react'
import {ImagePickerAsset} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {compressVideo} from '#/lib/media/video/compress'
import {logger} from '#/logger'
import {VideoTooLargeError} from 'lib/media/video/errors'
import * as Toast from 'view/com/util/Toast'

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
    onError: (e: any) => {
      // Don't log these errors in sentry, just let the user know
      if (e instanceof VideoTooLargeError) {
        Toast.show(_(msg`Videos cannot be larger than 100MB`))
        return
      }
      logger.error('Failed to compress video', {safeError: e})
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
