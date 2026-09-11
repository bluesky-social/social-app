import {MAX_IMAGES_PER_POST} from '#/components/ComposerV2/store/const'
import {type MediaAttachment} from '#/components/ComposerV2/store/types'

/** Only an empty media slot or an existing image set accepts more items. */
export function computePostMediaSelectionsRemaining(
  media: MediaAttachment | undefined,
): {
  imageSelectionsRemaining: number
  videoSelectionsRemaining: number
  gifSelectionsRemaining: number
} {
  if (!media) {
    return {
      imageSelectionsRemaining: MAX_IMAGES_PER_POST,
      videoSelectionsRemaining: 1,
      gifSelectionsRemaining: 1,
    }
  }
  return {
    imageSelectionsRemaining:
      media.state === 'resolved' && media.kind === 'images'
        ? Math.max(0, MAX_IMAGES_PER_POST - media.items.length)
        : 0,
    videoSelectionsRemaining: 0,
    gifSelectionsRemaining: 0,
  }
}
