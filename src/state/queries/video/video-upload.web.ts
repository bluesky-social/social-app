import {AppBskyVideoDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'
import {nanoid} from 'nanoid/non-secure'

import {cancelable} from '#/lib/async/cancelable'
import {ServerError} from '#/lib/media/video/errors'
import {CompressedVideo} from '#/lib/media/video/types'
import {createVideoEndpointUrl, mimeToExt} from '#/state/queries/video/util'
import {useSession} from '#/state/session'
import {useServiceAuthToken, useVideoUploadLimits} from './video-upload.shared'

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
  const getToken = useServiceAuthToken()
  const checkLimits = useVideoUploadLimits()
  const {_} = useLingui()

  return useMutation({
    mutationKey: ['video', 'upload'],
    mutationFn: cancelable(async (video: CompressedVideo) => {
      const token = await getToken()

      await checkLimits(token)

      const uri = createVideoEndpointUrl('/xrpc/app.bsky.video.uploadVideo', {
        did: currentAccount!.did,
        name: `${nanoid(12)}.${mimeToExt(video.mimeType)}`,
      })

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
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
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
