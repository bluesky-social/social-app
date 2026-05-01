import {
  type AddMediaInput,
  type PostEmbedMedia,
} from '#/components/ComposerV2/store/types'

export function buildPostMediaItem(
  input: AddMediaInput,
  ids: {id: string; postId: string},
): PostEmbedMedia {
  if (input.kind === 'image') {
    return {
      kind: 'image',
      id: ids.id,
      postId: ids.postId,
      uri: input.uri,
      width: input.width,
      height: input.height,
      altText: input.altText ?? '',
      upload: {state: 'pending'},
    }
  }
  if (input.kind === 'video') {
    return {
      kind: 'video',
      id: ids.id,
      postId: ids.postId,
      uri: input.uri,
      width: input.width,
      height: input.height,
      mimeType: input.mimeType,
      altText: input.altText ?? '',
      captions: [],
      upload: {state: 'pending'},
    }
  }
  return {
    kind: 'gif',
    id: ids.id,
    postId: ids.postId,
    gif: input.gif,
    altText: input.altText ?? '',
  }
}
