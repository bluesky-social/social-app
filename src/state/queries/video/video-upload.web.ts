import {useMutation} from '@tanstack/react-query'
import {nanoid} from 'nanoid/non-secure'

import {CompressedVideo} from 'lib/media/video/compress'
import {UploadVideoResponse} from 'lib/media/video/types'
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
      const uri = createUrl('/upload', {
        did: currentAccount!.did,
        name: `hailey-${nanoid(12)}.mp4`,
      })

      const bytes = await fetch(video.uri).then(res => res.arrayBuffer())
      const res = await fetch(uri, {
        method: 'POST',
        headers: {
          'dev-key': UPLOAD_HEADER,
          'content-type': 'video/mp4',
        },
        body: bytes,
      })

      const json = (await res.json()) as UploadVideoResponse

      // @TODO rm
      console.log('[VIDEO]', json)
      const responseBody = json as UploadVideoResponse
      onSuccess(responseBody)
      return responseBody
    },
    onError,
    onSuccess,
  })
}
