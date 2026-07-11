import {type AppBskyEmbedVideo} from '@atproto/api'

export function VideoEmbedInnerWeb(_props: {
  embed: AppBskyEmbedVideo.View
  active: boolean
  setActive: () => void
  onScreen: boolean
  lastKnownTime: React.RefObject<number | undefined>
}): never {
  throw new Error('VideoEmbedInnerWeb may not be used on native.')
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
