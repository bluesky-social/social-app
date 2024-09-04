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

      let bytes = video.bytes

      if (!bytes) {
        bytes = await fetch(video.uri).then(res => res.arrayBuffer())
      }

      const xhr = new XMLHttpRequest()
      const res = await new Promise<AppBskyVideoDefs.JobStatus>(
        (resolve, reject) => {
          xhr.upload.addEventListener('progress', e => {
            const progress = e.loaded / e.total
            setProgress(progress)
          })
          xhr.onloadend = () => {
            if (xhr.readyState === 4) {
              const uploadRes = JSON.parse(
                xhr.responseText,
              ) as AppBskyVideoDefs.JobStatus
              resolve(uploadRes)
            } else {
              reject(new ServerError(_(msg`Failed to upload video`)))
            }
          }
          xhr.onerror = () => {
            reject(new ServerError(_(msg`Failed to upload video`)))
          }
          xhr.open('POST', uri)
          xhr.setRequestHeader('Content-Type', video.mimeType)
          xhr.setRequestHeader('Authorization', `Bearer ${serviceAuth.token}`)
          xhr.send(bytes)
        },
      )

      if (!res.jobId) {
        throw new ServerError(res.error || _(msg`Failed to upload video`))
      }

      return res
    }, signal),
    onError,
    onSuccess,
  })
}
