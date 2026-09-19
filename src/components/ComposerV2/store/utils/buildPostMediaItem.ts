import {
  type AddMediaInput,
  type PostMediaGif,
  type PostMediaImage,
  type PostMediaItem,
  type PostMediaVideo,
} from '#/components/ComposerV2/store/types'

type MediaIds = {id: string; postId: string}

export function buildPostMediaItem(
  input: Extract<AddMediaInput, {kind: 'image'}>,
  ids: MediaIds,
): PostMediaImage
export function buildPostMediaItem(
  input: Extract<AddMediaInput, {kind: 'video'}>,
  ids: MediaIds,
): PostMediaVideo
export function buildPostMediaItem(
  input: Extract<AddMediaInput, {kind: 'gif'}>,
  ids: MediaIds,
): PostMediaGif
export function buildPostMediaItem(
  input: AddMediaInput,
  ids: MediaIds,
): PostMediaItem
/** Copy source data into a fresh item with a new upload lifecycle. */
export function buildPostMediaItem(
  input: AddMediaInput,
  ids: MediaIds,
): PostMediaItem {
  if (input.kind === 'image') {
    return {
      kind: 'image',
      id: ids.id,
      postId: ids.postId,
      uri: input.uri,
      width: input.width,
      height: input.height,
      altText: input.altText ?? '',
      mimeType: input.mimeType,
      localRefPath: input.localRefPath,
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
      duration: input.duration,
      localRefPath: input.localRefPath,
      file: input.file,
      captions: input.captions?.map(caption => ({...caption})) ?? [],
      captionBlobs: [],
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
