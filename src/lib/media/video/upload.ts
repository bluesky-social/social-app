import {type Client} from '@atproto/lex'
import {type I18n} from '@lingui/core'

import {AbortError} from '#/lib/async/cancelable'
import {type CompressedVideo} from '#/lib/media/video/types'
import {uploadVideoMultipart} from './multipart/upload'
import {getVideoUploadLimits} from './upload.shared'

export async function uploadVideo({
  video,
  client,
  dispatchUrl,
  setProgress,
  signal,
  i18n,
}: {
  video: CompressedVideo
  client: Client
  /** The account's PDS/dispatch URL, for the uploadBlob service-auth token. */
  dispatchUrl: string | URL
  setProgress: (progress: number) => void
  signal: AbortSignal
  i18n: I18n
}) {
  if (signal.aborted) {
    throw new AbortError()
  }
  await getVideoUploadLimits(client, i18n)

  return await uploadVideoMultipart({
    video,
    client,
    dispatchUrl,
    setProgress,
    signal,
  })
}
