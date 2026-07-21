import {createUploadTask, FileSystemUploadType} from 'expo-file-system/legacy'
import {type AppBskyVideoDefs, type AtpAgent} from '@atproto/api'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {nanoid} from 'nanoid/non-secure'

import {AbortError} from '#/lib/async/cancelable'
import {ServerError} from '#/lib/media/video/errors'
import {type CompressedVideo} from '#/lib/media/video/types'
import {Features, features} from '#/analytics/features'
import {MultipartFallbackError, uploadVideoMultipart} from './multipart/upload'
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

  if (features.isOn(Features.VideoMultipartUploadEnable)) {
    try {
      return await uploadVideoMultipart({video, agent, setProgress, signal})
    } catch (err) {
      if (!(err instanceof MultipartFallbackError)) throw err
      setProgress(0)
    }
  }

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
    throw new ServerError(
      responseBody.error || i18n._(msg`Failed to upload video`),
    )
  }

  if (signal.aborted) {
    throw new AbortError()
  }
  return responseBody
}
