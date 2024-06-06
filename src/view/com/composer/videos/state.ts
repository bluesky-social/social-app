import {useState} from 'react'
import * as FileSystem from 'expo-file-system'
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
        onProgress: progressMs => {
          if (asset.duration) {
            setProgress(progressMs / asset.duration)
          }
        },
      })
      if (!compressed.uri) {
        throw new Error('Failed to compress video')
      }

      const res = await FileSystem.getInfoAsync(compressed.uri, {size: true})
      if (res.exists) {
        console.log(
          'uncompressed size',
          (asset.fileSize! / 1024 / 1024).toFixed(2) + 'mb',
        )
        console.log(
          'compressed size',
          (res.size / 1024 / 1024).toFixed(2) + 'mb',
        )
        return res
      } else {
        throw new Error('Could not find output video')
      }
    },
    onError: error => {
      console.error('error', error)
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
