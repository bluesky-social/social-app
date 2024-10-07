import {AppBskyVideoDefs} from '@atproto/api'
import {BskyAgent} from '@atproto/api'
import {I18n} from '@lingui/core'
import {msg} from '@lingui/macro'
import {nanoid} from 'nanoid/non-secure'

import {AbortError} from '#/lib/async/cancelable'
import {ServerError} from '#/lib/media/video/errors'
import {CompressedVideo} from '#/lib/media/video/types'
import {getServiceAuthToken, getVideoUploadLimits} from './upload.shared'
import {createVideoEndpointUrl, mimeToExt} from './util'

export async function uploadVideo({
  video,
  agent,
  did,
  setProgress,
  signal,
  _,
}: {
  video: CompressedVideo
  agent: BskyAgent
  did: string
  setProgress: (progress: number) => void
  signal: AbortSignal
  _: I18n['_']
}) {
  if (signal.aborted) {
    throw new AbortError()
  }
  await getVideoUploadLimits(agent, _)

  const uri = createVideoEndpointUrl('/xrpc/app.bsky.video.uploadVideo', {
    did,
    name: `${nanoid(12)}.${mimeToExt(video.mimeType)}`,
  })

  let bytes = video.bytes
  if (!bytes) {
    if (signal.aborted) {
      throw new AbortError()
    }
    bytes = await fetch(video.uri).then(res => res.arrayBuffer())
  }

  if (signal.aborted) {
    throw new AbortError()
  }
  const token = await getServiceAuthToken({
    agent,
    lxm: 'com.atproto.repo.uploadBlob',
    exp: Date.now() / 1000 + 60 * 30, // 30 minutes
  })

  if (signal.aborted) {
    throw new AbortError()
  }
  const xhr = new XMLHttpRequest()
  const res = await new Promise<AppBskyVideoDefs.JobStatus>(
    (resolve, reject) => {
      xhr.upload.addEventListener('progress', e => {
        const progress = e.loaded / e.total
        setProgress(progress)
      })
      xhr.onloadend = () => {
        if (signal.aborted) {
          reject(new AbortError())
        } else if (xhr.readyState === 4) {
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

  if (signal.aborted) {
    throw new AbortError()
  }
  return res
}
