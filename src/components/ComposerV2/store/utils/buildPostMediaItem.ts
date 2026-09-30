import {
  type AddMediaInput,
  type PostMediaGif,
  type PostMediaImage,
  type PostMediaItem,
  type PostMediaVideo,
} from '#/components/ComposerV2/store/types'

export function buildPostMediaItem(args: {
  input: Extract<AddMediaInput, {kind: 'image'}>
  id: string
  postId: string
}): PostMediaImage
export function buildPostMediaItem(args: {
  input: Extract<AddMediaInput, {kind: 'video'}>
  id: string
  postId: string
}): PostMediaVideo
export function buildPostMediaItem(args: {
  input: Extract<AddMediaInput, {kind: 'gif'}>
  id: string
  postId: string
}): PostMediaGif
export function buildPostMediaItem(args: {
  input: AddMediaInput
  id: string
  postId: string
}): PostMediaItem
/** Copy source data into a fresh item with a new upload lifecycle. */
export function buildPostMediaItem({
  input,
  id,
  postId,
}: {
  input: AddMediaInput
  id: string
  postId: string
}): PostMediaItem {
  if (input.kind === 'image') {
    return {
      kind: 'image',
      id,
      postId,
      uri: input.uri,
      width: input.width,
      height: input.height,
      altText: input.altText ?? '',
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      localRefPath: input.localRefPath,
      upload: {state: 'pending'},
    }
  }
  if (input.kind === 'video') {
    return {
      kind: 'video',
      id,
      postId,
      uri: input.uri,
      width: input.width,
      height: input.height,
      mimeType: input.mimeType,
      altText: input.altText ?? '',
      duration: input.duration,
      fileSize: input.fileSize,
      localRefPath: input.localRefPath,
      file: input.file,
      captions: input.captions?.map(caption => ({...caption})) ?? [],
      captionBlobs: [],
      upload: {state: 'pending'},
    }
  }
  return {
    kind: 'gif',
    id,
    postId,
    gif: input.gif,
    altText: input.altText ?? '',
  }
}
