import {type AppBskyEmbedVideo} from '@atproto/api'

export type VideoEmbedInnerWebProps = {
  embed: AppBskyEmbedVideo.View
  active: boolean
  setActive: () => void
  onScreen: boolean
  lastKnownTime: React.RefObject<number | undefined>
}

export class HLSUnsupportedError extends Error {
  constructor() {
    super('HLS is not supported')
  }
}

export class VideoNotFoundError extends Error {
  constructor() {
    super('Video not found')
  }
}

/**
 * Fatal hls.js playback error. `detail` is the hls.js error details code
 * (e.g. bufferAppendError), which buckets failures more usefully than the
 * error message.
 */
export class HLSFatalError extends Error {
  detail: string
  constructor(detail: string, cause: Error) {
    super(cause.message, {cause})
    this.detail = detail
  }
}
