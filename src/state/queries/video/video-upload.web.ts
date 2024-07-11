import {useMutation} from '@tanstack/react-query'
import {nanoid} from 'nanoid/non-secure'

import {CompressedVideo} from 'lib/media/video/compress'
import {UploadVideoResponse} from 'lib/media/video/types'
import {createVideoEndpointUrl} from 'state/queries/video/util'
import {useSession} from 'state/session'
const UPLOAD_HEADER = process.env.EXPO_PUBLIC_VIDEO_HEADER ?? ''

export const useUploadVideoMutation = ({
  onSuccess,
  onError,
  setProgress,
}: {
  onSuccess: (response: UploadVideoResponse) => void
  onError: (e: any) => void
  setProgress: (progress: number) => void
}) => {
  const {currentAccount} = useSession()

  return useMutation({
    mutationFn: async (video: CompressedVideo) => {
      const uri = createVideoEndpointUrl('/upload', {
        did: currentAccount!.did,
        name: `hailey-${nanoid(12)}.mp4`,
      })

      const bytes = await fetch(video.uri).then(res => res.arrayBuffer())

      const xhr = new XMLHttpRequest()
      const res = (await new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', e => {
          const progress = e.loaded / e.total
          setProgress(progress)
        })
        xhr.onloadend = () => {
          if (xhr.readyState === 4) {
            resolve(JSON.parse(xhr.responseText))
          }
        }
        xhr.onerror = () => {
          reject()
          onError(new Error('Failed to upload video'))
        }
        xhr.open('POST', uri)
        xhr.setRequestHeader('Content-Type', 'video/mp4')
        xhr.setRequestHeader('dev-key', UPLOAD_HEADER)
        xhr.send(bytes)
      })) as UploadVideoResponse

      // @TODO handle all error states

      // @TODO rm
      console.log('[VIDEO]', res)
      onSuccess(res)
      return res
    },
    onError,
    onSuccess,
  })
}
