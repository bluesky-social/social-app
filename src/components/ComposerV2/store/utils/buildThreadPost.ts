import {MAX_IMAGES_PER_POST} from '#/components/ComposerV2/store/const'
import {
  type MediaAttachment,
  type MediaAttachmentInput,
  type ThreadPost,
  type ThreadPostInitialState,
} from '#/components/ComposerV2/store/types'
import {buildPostMediaItem} from '#/components/ComposerV2/store/utils/buildPostMediaItem'
import {computePostMediaSelectionsRemaining} from '#/components/ComposerV2/store/utils/computePostMediaSelectionsRemaining'

/** Build the first snapshot directly, without actions or background work. */
export function buildThreadPost(
  postId: string,
  createId: () => string,
  input: ThreadPostInitialState = {},
): ThreadPost {
  const recordInput = input.attachments?.record
  const media = buildMedia(input.attachments?.media, postId, createId)
  return {
    text: input.text ?? '',
    langs: [...(input.langs ?? [])],
    labels: [...(input.labels ?? [])],
    tags: [...(input.tags ?? [])],
    attachments: {
      record: !recordInput
        ? undefined
        : recordInput.kind === 'uri'
          ? {state: 'pending', uri: recordInput.uri}
          : {
              state: 'resolved',
              ...recordInput,
              record: {...recordInput.record},
            },
      media,
    },
    ...computePostMediaSelectionsRemaining(media),
  }
}

function buildMedia(
  input: MediaAttachmentInput | undefined,
  postId: string,
  createId: () => string,
): MediaAttachment | undefined {
  if (!input) return undefined
  switch (input.kind) {
    case 'uri':
      return {state: 'pending', uri: input.uri}
    case 'images':
      /* Unlike picker overflow, invalid normalized input must not lose data. */
      if (input.items.length > MAX_IMAGES_PER_POST) {
        throw new RangeError(
          `Initial media exceeds ${MAX_IMAGES_PER_POST} images`,
        )
      }
      if (input.items.length === 0) return undefined
      return {
        state: 'resolved',
        kind: 'images',
        items: input.items.map(item =>
          buildPostMediaItem(
            {...item, kind: 'image'},
            {postId, id: createId()},
          ),
        ),
      }
    case 'video':
      return {
        state: 'resolved',
        kind: 'video',
        item: buildPostMediaItem(
          {...input.item, kind: 'video'},
          {postId, id: createId()},
        ),
      }
    case 'gif':
      return {
        state: 'resolved',
        kind: 'gif',
        item: buildPostMediaItem(
          {...input.item, kind: 'gif'},
          {postId, id: createId()},
        ),
      }
    case 'external':
      return {
        state: 'resolved',
        ...input,
        associatedRefs: input.associatedRefs?.map(ref => ({...ref})),
      }
    case 'chat-invite':
      return {state: 'resolved', ...input}
  }
}
