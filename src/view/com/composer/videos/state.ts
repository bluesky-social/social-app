import {useState} from 'react'
import * as FileSystem from 'expo-file-system'
import {ImagePickerAsset} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {compressVideo} from '#/lib/media/video/compress'

export function useVideoState({setError}: {setError: (error: string) => void}) {
  const [pending, setVideoPending] = useState(false)
  const {_} = useLingui()

  const {mutate, data, isPending, isError, reset} = useMutation({
    mutationFn: async (asset: ImagePickerAsset) => {
      const compressed = await compressVideo(asset.uri)
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
  })

  return {
    video: data,
    onSelectVideo: mutate,
    videoPending: pending || isPending,
    setVideoPending,
    videoError: isError,
    clearVideo: reset,
  }
}
