import {createUploadTask, FileSystemUploadType} from 'expo-file-system'
import {AppBskyVideoDefs} from '@atproto/api'
import {useMutation} from '@tanstack/react-query'
import {nanoid} from 'nanoid/non-secure'

import {CompressedVideo} from '#/lib/media/video/compress'
import {createVideoEndpointUrl} from '#/state/queries/video/util'
import {useAgent, useSession} from '#/state/session'

const UPLOAD_HEADER = process.env.EXPO_PUBLIC_VIDEO_HEADER ?? ''

export const useUploadVideoMutation = ({
  onSuccess,
  onError,
  setProgress,
}: {
  onSuccess: (response: AppBskyVideoDefs.JobStatus) => void
  onError: (e: any) => void
  setProgress: (progress: number) => void
}) => {
  const {currentAccount} = useSession()
  const agent = useAgent()

  return useMutation({
    mutationFn: async (video: CompressedVideo) => {
      const uri = createVideoEndpointUrl('/xrpc/app.bsky.video.uploadVideo', {
        did: currentAccount!.did,
        name: `${nanoid(12)}.mp4`, // @TODO what are we limiting this to?
      })

      // a logged-in agent should have this set, but we'll check just in case
      if (!agent.pdsUrl) {
        throw new Error('Agent does not have a PDS URL')
      }

      const {data: serviceAuth} = await agent.com.atproto.server.getServiceAuth(
        {
          aud: `did:web:${agent.pdsUrl.hostname}`,
          lxm: 'com.atproto.repo.uploadBlob',
        },
      )

      const uploadTask = createUploadTask(
        uri,
        video.uri,
        {
          headers: {
            'dev-key': UPLOAD_HEADER,
            'content-type': 'video/mp4',
            Authorization: `Bearer ${serviceAuth.token}`,
          },
          httpMethod: 'POST',
          uploadType: FileSystemUploadType.BINARY_CONTENT,
        },
        p => setProgress(p.totalBytesSent / p.totalBytesExpectedToSend),
      )
      const res = await uploadTask.uploadAsync()

      if (!res?.body) {
        throw new Error('No response')
      }

      const responseBody = JSON.parse(res.body) as AppBskyVideoDefs.JobStatus
      return responseBody
    },
    onError,
    onSuccess,
  })
}
