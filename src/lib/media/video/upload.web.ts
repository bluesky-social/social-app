import {type AppBskyVideoDefs, type AtpAgent} from '@atproto/api'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {nanoid} from 'nanoid/non-secure'

import {AbortError} from '#/lib/async/cancelable'
import {ServerError} from '#/lib/media/video/errors'
import {type CompressedVideo} from '#/lib/media/video/types'
import {getServiceAuthToken, getVideoUploadLimits} from './upload.shared'
import {createVideoEndpointUrl, mimeToExt} from './util'

export async function uploadVideo({
  video,
  agent,
  did,
  setProgress,
  signal,
  i18n,
}: {
  video: CompressedVideo
  agent: AtpAgent
  did: string
  setProgress: (progress: number) => void
  signal: AbortSignal
  i18n: I18n
}) {
  if (signal.aborted) {
    throw new AbortError()
  }
  await getVideoUploadLimits(agent, i18n)

  const uri = createVideoEndpointUrl('/xrpc/app.bsky.video.uploadVideo', {
    did,
    name: `${nanoid(12)}.${mimeToExt(video.mimeType)}`,
  })

  // Stream the Blob directly; loading the whole file as ArrayBuffer OOMs mobile Safari.
  let body: Blob | ArrayBuffer
  if (video.bytes) {
    body = video.bytes
  } else {
    if (signal.aborted) {
      throw new AbortError()
    }
    body = await fetch(video.uri).then(res => res.blob())
  }

  if (signal.aborted) {
    throw new AbortError()
  }
  // Token aud defaults to the user's PDS DID; the video service forwards uploadBlob there.
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
      const onAbort = () => {
        try {
          xhr.abort()
        } catch {}
        reject(new AbortError())
      }
      if (signal.aborted) {
        return onAbort()
      }
      signal.addEventListener('abort', onAbort, {once: true})
      xhr.upload.addEventListener('progress', e => {
        const progress = e.loaded / e.total
        setProgress(progress)
      })
      xhr.onloadend = () => {
        signal.removeEventListener('abort', onAbort)
        if (signal.aborted) {
          reject(new AbortError())
        } else if (xhr.readyState === 4) {
          const uploadRes = JSON.parse(
            xhr.responseText,
          ) as AppBskyVideoDefs.JobStatus
          resolve(uploadRes)
        } else {
          reject(new ServerError(i18n._(msg`Failed to upload video`)))
        }
      }
      xhr.onerror = () => {
        signal.removeEventListener('abort', onAbort)
        reject(new ServerError(i18n._(msg`Failed to upload video`)))
      }
      xhr.open('POST', uri)
      xhr.setRequestHeader('Content-Type', video.mimeType)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(body)
    },
  )

  if (!res.jobId) {
    throw new ServerError(res.error || i18n._(msg`Failed to upload video`))
  }

  if (signal.aborted) {
    throw new AbortError()
  }
  return res
}
