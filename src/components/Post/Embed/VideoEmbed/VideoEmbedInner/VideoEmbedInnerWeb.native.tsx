import {type VideoEmbedInnerWebProps} from './VideoEmbedInnerWeb.shared'

export {
  HLSFatalError,
  HLSUnsupportedError,
  VideoNotFoundError,
} from './VideoEmbedInnerWeb.shared'

export function VideoEmbedInnerWeb(_props: VideoEmbedInnerWebProps): never {
  throw new Error('VideoEmbedInnerWeb may not be used on native.')
}
