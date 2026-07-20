import {createUploadTask, FileSystemUploadType} from 'expo-file-system/legacy'
import {type Client} from '@atproto/lex'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {nanoid} from 'nanoid/non-secure'

import {AbortError} from '#/lib/async/cancelable'
import {ServerError} from '#/lib/media/video/errors'
import {type CompressedVideo} from '#/lib/media/video/types'
import {type app} from '#/lexicons'
import {getServiceAuthToken, getVideoUploadLimits} from './upload.shared'
import {createVideoEndpointUrl, mimeToExt} from './util'

export async function uploadVideo({
  video,
  client,
  dispatchUrl,
  did,
  setProgress,
  signal,
  i18n,
}: {
  video: CompressedVideo
  client: Client
  /** The account's PDS/dispatch URL, for the uploadBlob service-auth token. */
  dispatchUrl: string | URL
  did: string
  setProgress: (progress: number) => void
  signal: AbortSignal
  i18n: I18n
}) {
  if (signal.aborted) {
    throw new AbortError()
  }
  await getVideoUploadLimits(client, i18n)

  const uri = createVideoEndpointUrl('/xrpc/app.bsky.video.uploadVideo', {
    did,
    name: `${nanoid(12)}.${mimeToExt(video.mimeType)}`,
  })

  if (signal.aborted) {
    throw new AbortError()
  }
  const token = await getServiceAuthToken({
    client,
    dispatchUrl,
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

  const responseBody = JSON.parse(res.body) as app.bsky.video.defs.JobStatus

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
