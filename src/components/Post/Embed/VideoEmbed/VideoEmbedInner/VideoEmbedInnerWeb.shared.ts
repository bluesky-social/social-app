import {type app} from '#/lexicons'

export type VideoEmbedInnerWebProps = {
  embed: app.bsky.embed.video.View
  active: boolean
  setActive: () => void
  onScreen: boolean
  lastKnownTime: React.RefObject<number | undefined>
  onPlaybackStart: (autoplay: boolean) => void
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
  type: string
  diagnostics: Record<string, unknown>
  constructor({
    detail,
    type,
    cause,
    diagnostics,
  }: {
    detail: string
    type: string
    cause: Error
    diagnostics: Record<string, unknown>
  }) {
    super(cause.message, {cause})
    this.detail = detail
    this.type = type
    this.diagnostics = diagnostics
  }
}
