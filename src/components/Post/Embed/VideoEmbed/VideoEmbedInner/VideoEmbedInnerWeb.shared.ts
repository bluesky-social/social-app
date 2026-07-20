import {type app} from '#/lexicons'

export type VideoEmbedInnerWebProps = {
  embed: app.bsky.embed.video.View
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
