import {createUploadTask, FileSystemUploadType} from 'expo-file-system'
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
        name: `${nanoid(12)}.mp4`, // @TODO what are we limiting this to?
      })

      const uploadTask = createUploadTask(
        uri,
        video.uri,
        {
          headers: {
            'dev-key': UPLOAD_HEADER,
            'content-type': 'video/mp4', // @TODO same question here. does the compression step always output mp4?
          },
          httpMethod: 'POST',
          uploadType: FileSystemUploadType.BINARY_CONTENT,
        },
        p => {
          setProgress(p.totalBytesSent / p.totalBytesExpectedToSend)
        },
      )
      const res = await uploadTask.uploadAsync()

      if (!res?.body) {
        throw new Error('No response')
      }

      // @TODO rm, useful for debugging/getting video cid
      console.log('[VIDEO]', res.body)
      const responseBody = JSON.parse(res.body) as UploadVideoResponse
      onSuccess(responseBody)
      return responseBody
    },
    onError,
    onSuccess,
  })
}
