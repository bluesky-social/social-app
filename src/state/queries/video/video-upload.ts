import {createUploadTask, FileSystemUploadType} from 'expo-file-system'
import {AppBskyVideoDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'
import {nanoid} from 'nanoid/non-secure'

import {cancelable} from '#/lib/async/cancelable'
import {ServerError} from '#/lib/media/video/errors'
import {CompressedVideo} from '#/lib/media/video/types'
import {createVideoEndpointUrl, mimeToExt} from '#/state/queries/video/util'
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
  const {_} = useLingui()

  return useMutation({
    mutationKey: ['video', 'upload'],
    mutationFn: cancelable(async (video: CompressedVideo) => {
      const uri = createVideoEndpointUrl('/xrpc/app.bsky.video.uploadVideo', {
        did: currentAccount!.did,
        name: `${nanoid(12)}.${mimeToExt(video.mimeType)}`,
      })

      const serviceAuthAud = getServiceAuthAudFromUrl(agent.dispatchUrl)

      if (!serviceAuthAud) {
        throw new Error('Agent does not have a PDS URL')
      }

      const {data: serviceAuth} = await agent.com.atproto.server.getServiceAuth(
        {
          aud: serviceAuthAud,
          lxm: 'com.atproto.repo.uploadBlob',
          exp: Date.now() / 1000 + 60 * 30, // 30 minutes
        },
      )

      const uploadTask = createUploadTask(
        uri,
        video.uri,
        {
          headers: {
            'content-type': video.mimeType,
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

      if (!responseBody.jobId) {
        throw new ServerError(
          responseBody.error || _(msg`Failed to upload video`),
        )
      }

      return responseBody
    }, signal),
    onError,
    onSuccess,
  })
}
