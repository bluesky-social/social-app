import {
  type MediaAttachment,
  type PostMediaItem,
} from '#/components/ComposerV2/store/types'

/** Item-level actions ignore link cards and unresolved media candidates. */
export function getMediaItems({
  media,
}: {
  media: MediaAttachment | undefined
}): PostMediaItem[] {
  if (media?.state !== 'resolved') return []
  switch (media.kind) {
    case 'images':
      return media.items
    case 'video':
    case 'gif':
      return [media.item]
    default:
      return []
  }
}
