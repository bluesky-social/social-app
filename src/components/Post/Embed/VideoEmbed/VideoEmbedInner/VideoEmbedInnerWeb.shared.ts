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
