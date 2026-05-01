import {MAX_IMAGES_PER_POST} from '#/components/ComposerV2/store/const'
import {
  type AddMediaInput,
  type PostEmbedMedia,
} from '#/components/ComposerV2/store/types'

/**
 * Filters and caps a list of addMedia inputs based on what's already on the
 * post:
 *
 * - If the post already has a video or gif, addMedia is a no-op.
 * - If the post already has images, only image inputs are accepted, up to a
 *   total of MAX_IMAGES_PER_POST (existing + new).
 * - If the post has no media yet, the first input's kind dictates the kind
 *   for the call: items of any other kind are dropped, and the remainder is
 *   capped at the per-kind limit (4 images, 1 video, 1 gif).
 *
 * NOTE: this is likely temporary - the first-input-dictates-kind rule is a
 * placeholder until the UI gates the picker properly. The mutual-exclusion
 * with external link cards is permanent and is enforced by the caller
 * (addMedia) before invoking this function.
 */
export function filterMediaInputs(
  existing: PostEmbedMedia[],
  inputs: AddMediaInput[],
): AddMediaInput[] {
  if (existing.length > 0) {
    // Existing media is locked into a single kind; only same-kind images
    // can be appended, otherwise nothing more is accepted.
    if (existing[0].kind !== 'image') return []
    const remaining = MAX_IMAGES_PER_POST - existing.length
    if (remaining <= 0) return []
    return inputs.filter(i => i.kind === 'image').slice(0, remaining)
  }
  const kind = inputs[0].kind
  const sameKind = inputs.filter(i => i.kind === kind)
  const cap = kind === 'image' ? MAX_IMAGES_PER_POST : 1
  return sameKind.slice(0, cap)
}
