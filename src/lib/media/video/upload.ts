import {createUploadTask, FileSystemUploadType} from 'expo-file-system'
import {AppBskyVideoDefs, BskyAgent} from '@atproto/api'
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

  if (signal.aborted) {
    throw new AbortError()
  }
  const token = await getServiceAuthToken({
    agent,
    lxm: 'com.atproto.repo.uploadBlob',
    exp: Date.now() / 1000 + 60 * 30, // 30 minutes
  })
  const uploadTask = createUploadTask(
    uri,
    video.uri,
    {
      headers: {
        'content-type': video.mimeType,
        Authorization: `Bearer ${token}`,
      },
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.BINARY_CONTENT,
    },
    p => setProgress(p.totalBytesSent / p.totalBytesExpectedToSend),
  )

  if (signal.aborted) {
    throw new AbortError()
  }
  const res = await uploadTask.uploadAsync()

  if (!res?.body) {
    throw new Error('No response')
  }

  const responseBody = JSON.parse(res.body) as AppBskyVideoDefs.JobStatus

  if (!responseBody.jobId) {
    throw new ServerError(responseBody.error || _(msg`Failed to upload video`))
  }

  if (signal.aborted) {
    throw new AbortError()
  }
  return responseBody
}
