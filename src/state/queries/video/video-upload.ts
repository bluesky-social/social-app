import {createUploadTask, FileSystemUploadType} from 'expo-file-system'
import {AppBskyVideoDefs} from '@atproto/api'
import {useMutation} from '@tanstack/react-query'
import {nanoid} from 'nanoid/non-secure'

import {cancelable} from '#/lib/async/cancelable'
import {CompressedVideo} from '#/lib/media/video/compress'
import {createVideoEndpointUrl} from '#/state/queries/video/util'
import {useAgent, useSession} from '#/state/session'
import {getServiceAuthAudFromUrl} from 'lib/strings/url-helpers'

export const useUploadVideoMutation = ({
  onSuccess,
  onError,
  setProgress,
  signal,
}: {
  onSuccess: (response: AppBskyVideoDefs.JobStatus) => void
  onError: (e: any) => void
  setProgress: (progress: number) => void
  signal: AbortSignal
}) => {
  const {currentAccount} = useSession()
  const agent = useAgent()

  return useMutation({
    mutationKey: ['video', 'upload'],
    mutationFn: cancelable(async (video: CompressedVideo) => {
      const uri = createVideoEndpointUrl('/xrpc/app.bsky.video.uploadVideo', {
        did: currentAccount!.did,
        name: `${nanoid(12)}.mp4`, // @TODO what are we limiting this to?
      })

      if (!currentAccount?.service) {
        throw new Error('User is not logged in')
      }

      const serviceAuthAud = getServiceAuthAudFromUrl(currentAccount.service)
      if (!serviceAuthAud) {
        throw new Error('Agent does not have a PDS URL')
      }

      const {data: serviceAuth} = await agent.com.atproto.server.getServiceAuth(
        {
          aud: serviceAuthAud,
          lxm: 'com.atproto.repo.uploadBlob',
        },
      )

      const uploadTask = createUploadTask(
        uri,
        video.uri,
        {
          headers: {
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
    }, signal),
    onError,
    onSuccess,
  })
}
