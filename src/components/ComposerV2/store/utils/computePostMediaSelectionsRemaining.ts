import {MAX_IMAGES_PER_POST} from '#/components/ComposerV2/store/const'
import {type PostEmbedMedia} from '#/components/ComposerV2/store/types'

/**
 * Mirrors filterMediaInputs' rules. With no media, all kinds are open at
 * their per-kind cap. With existing images, only images are open up to a
 * total of MAX_IMAGES_PER_POST. With an existing video or gif, nothing more
 * can be added.
 */
export function computePostMediaSelectionsRemaining(media: PostEmbedMedia[]): {
  imageSelectionsRemaining: number
  videoSelectionsRemaining: number
  gifSelectionsRemaining: number
} {
  if (media.length === 0) {
    return {
      imageSelectionsRemaining: MAX_IMAGES_PER_POST,
      videoSelectionsRemaining: 1,
      gifSelectionsRemaining: 1,
    }
  }
  if (media[0].kind === 'image') {
    return {
      imageSelectionsRemaining: Math.max(0, MAX_IMAGES_PER_POST - media.length),
      videoSelectionsRemaining: 0,
      gifSelectionsRemaining: 0,
    }
  }
  return {
    imageSelectionsRemaining: 0,
    videoSelectionsRemaining: 0,
    gifSelectionsRemaining: 0,
  }
}
