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
      captions: normalizeCaptions({captions: input.captions}),
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

/*
 * Inbound captions can't reject a whole draft, so drop the ones that could
 * never publish correctly: blank languages, and later duplicates of a language.
 */
function normalizeCaptions({
  captions = [],
}: {
  captions?: ReadonlyArray<{lang: string; content: string}>
}) {
  const seen = new Set<string>()
  const result: Array<{lang: string; content: string}> = []
  for (const caption of captions) {
    const lang = caption.lang.trim()
    if (!lang || seen.has(lang)) continue
    seen.add(lang)
    result.push({lang, content: caption.content})
  }
  return result
}
