import {MAX_IMAGES_PER_POST} from '#/components/ComposerV2/store/const'
import {
  type AddMediaInput,
  type MediaAttachment,
} from '#/components/ComposerV2/store/types'

/**
 * Only same-kind images may be appended to an occupied media slot. On an
 * empty slot the first input chooses the kind; other kinds are discarded.
 * Pending/failed link cards reserve the slot just like resolved cards do.
 */
export function filterMediaInputs(
  existing: MediaAttachment | undefined,
  inputs: AddMediaInput[],
): AddMediaInput[] {
  if (inputs.length === 0) return []
  if (existing) {
    if (existing.state !== 'resolved' || existing.kind !== 'images') return []
    const remaining = MAX_IMAGES_PER_POST - existing.items.length
    if (remaining <= 0) return []
    return inputs.filter(i => i.kind === 'image').slice(0, remaining)
  }
  const kind = inputs[0].kind
  const sameKind = inputs.filter(i => i.kind === kind)
  const cap = kind === 'image' ? MAX_IMAGES_PER_POST : 1
  return sameKind.slice(0, cap)
}
