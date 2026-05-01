/**
 * Pure reducer functions for the ComposerV2 store.
 *
 * Each function takes the current state plus arguments and returns the next
 * state. They never throw on missing IDs; they return state unchanged so the
 * store layer doesn't have to coordinate "did anything happen" with async
 * sources like upload workers that may race a removePost.
 *
 * IDs are passed in (not generated here) so reducers stay deterministic and
 * tests don't need to mock id generation.
 */
import {
  type ComposerState,
  type ExternalEmbed,
  type GifItem,
  type ImageItem,
  type NewImageInput,
  type PostDraft,
  type Quote,
  type UploadStatus,
  type VideoItem,
} from './types'

export function createEmptyPost(id: string): PostDraft {
  return {
    id,
    text: '',
    langs: [],
    labels: [],
    media: undefined,
    external: undefined,
    quote: undefined,
  }
}

export function createInitialState(args: {
  rootPostId: string
  replyTo?: ComposerState['replyTo']
  draftId?: string
}): ComposerState {
  const root = createEmptyPost(args.rootPostId)
  return {
    posts: [root],
    replyTo: args.replyTo,
    draftId: args.draftId,
    isDirty: false,
  }
}

function mapPost(
  state: ComposerState,
  postId: string,
  fn: (post: PostDraft) => PostDraft,
): ComposerState {
  let changed = false
  const posts = state.posts.map(post => {
    if (post.id !== postId) return post
    const next = fn(post)
    if (next !== post) changed = true
    return next
  })
  if (!changed) return state
  return markDirty({...state, posts})
}

function markDirty(state: ComposerState): ComposerState {
  if (state.isDirty) return state
  return {...state, isDirty: true}
}

export function updateText(
  state: ComposerState,
  args: {postId: string; text: string},
): ComposerState {
  return mapPost(state, args.postId, post => {
    if (post.text === args.text) return post
    return {...post, text: args.text}
  })
}

export function updateLangs(
  state: ComposerState,
  args: {postId: string; langs: string[]},
): ComposerState {
  return mapPost(state, args.postId, post => ({...post, langs: args.langs}))
}

export function updateLabels(
  state: ComposerState,
  args: {postId: string; labels: string[]},
): ComposerState {
  return mapPost(state, args.postId, post => ({...post, labels: args.labels}))
}

export function appendPost(
  state: ComposerState,
  args: {id: string},
): ComposerState {
  const newPost = createEmptyPost(args.id)
  return markDirty({...state, posts: [...state.posts, newPost]})
}

export function insertPostAfter(
  state: ComposerState,
  args: {afterId: string; id: string},
): ComposerState {
  const idx = state.posts.findIndex(p => p.id === args.afterId)
  if (idx === -1) return state
  const newPost = createEmptyPost(args.id)
  const posts = [
    ...state.posts.slice(0, idx + 1),
    newPost,
    ...state.posts.slice(idx + 1),
  ]
  return markDirty({...state, posts})
}

export function removePost(
  state: ComposerState,
  args: {postId: string},
): ComposerState {
  // Never allow removing the last post; the composer always has at least one.
  if (state.posts.length <= 1) return state
  const posts = state.posts.filter(p => p.id !== args.postId)
  if (posts.length === state.posts.length) return state
  return markDirty({...state, posts})
}

export function addImages(
  state: ComposerState,
  args: {postId: string; images: Array<NewImageInput & {id: string; localRefPath: string}>},
): ComposerState {
  return mapPost(state, args.postId, post => {
    // Adding images replaces any existing video or gif since media is exclusive.
    const existing =
      post.media?.kind === 'images' ? post.media.items : ([] as ImageItem[])
    const next: ImageItem[] = [
      ...existing,
      ...args.images.map(img => ({
        id: img.id,
        uri: img.uri,
        width: img.width,
        height: img.height,
        altText: img.altText ?? '',
        localRefPath: img.localRefPath,
        upload: {state: 'pending'} as UploadStatus,
      })),
    ]
    return {...post, media: {kind: 'images', items: next}}
  })
}

export function removeImage(
  state: ComposerState,
  args: {postId: string; imageId: string},
): ComposerState {
  return mapPost(state, args.postId, post => {
    if (post.media?.kind !== 'images') return post
    const items = post.media.items.filter(i => i.id !== args.imageId)
    if (items.length === post.media.items.length) return post
    if (items.length === 0) return {...post, media: undefined}
    return {...post, media: {kind: 'images', items}}
  })
}

export function updateImageAltText(
  state: ComposerState,
  args: {postId: string; imageId: string; altText: string},
): ComposerState {
  return mapPost(state, args.postId, post => {
    if (post.media?.kind !== 'images') return post
    const items = post.media.items.map(i =>
      i.id === args.imageId ? {...i, altText: args.altText} : i,
    )
    return {...post, media: {kind: 'images', items}}
  })
}

export function setVideo(
  state: ComposerState,
  args: {postId: string; video: VideoItem},
): ComposerState {
  return mapPost(state, args.postId, post => ({
    ...post,
    media: {kind: 'video', item: args.video},
  }))
}

export function removeVideo(
  state: ComposerState,
  args: {postId: string},
): ComposerState {
  return mapPost(state, args.postId, post => {
    if (post.media?.kind !== 'video') return post
    return {...post, media: undefined}
  })
}

export function updateVideoAltText(
  state: ComposerState,
  args: {postId: string; altText: string},
): ComposerState {
  return mapPost(state, args.postId, post => {
    if (post.media?.kind !== 'video') return post
    return {
      ...post,
      media: {kind: 'video', item: {...post.media.item, altText: args.altText}},
    }
  })
}

export function setGif(
  state: ComposerState,
  args: {postId: string; gif: GifItem},
): ComposerState {
  return mapPost(state, args.postId, post => ({
    ...post,
    media: {kind: 'gif', item: args.gif},
  }))
}

export function removeGif(
  state: ComposerState,
  args: {postId: string},
): ComposerState {
  return mapPost(state, args.postId, post => {
    if (post.media?.kind !== 'gif') return post
    return {...post, media: undefined}
  })
}

export function updateGifAltText(
  state: ComposerState,
  args: {postId: string; altText: string},
): ComposerState {
  return mapPost(state, args.postId, post => {
    if (post.media?.kind !== 'gif') return post
    return {
      ...post,
      media: {kind: 'gif', item: {...post.media.item, altText: args.altText}},
    }
  })
}

export function setExternal(
  state: ComposerState,
  args: {postId: string; external: ExternalEmbed},
): ComposerState {
  return mapPost(state, args.postId, post => ({...post, external: args.external}))
}

export function removeExternal(
  state: ComposerState,
  args: {postId: string},
): ComposerState {
  return mapPost(state, args.postId, post => {
    if (!post.external) return post
    return {...post, external: undefined}
  })
}

export function setQuote(
  state: ComposerState,
  args: {postId: string; quote: Quote},
): ComposerState {
  return mapPost(state, args.postId, post => ({...post, quote: args.quote}))
}

export function removeQuote(
  state: ComposerState,
  args: {postId: string},
): ComposerState {
  return mapPost(state, args.postId, post => {
    if (!post.quote) return post
    return {...post, quote: undefined}
  })
}

/**
 * Update the upload status of a media item. Searches every post since the
 * upload worker only knows the media id, not which post it lives on (and posts
 * could have been reordered or removed in the meantime).
 *
 * Returns state unchanged if the media item no longer exists - this is the
 * expected case when an upload completes after the user removed the media.
 */
export function setUploadStatus(
  state: ComposerState,
  args: {mediaId: string; status: UploadStatus},
): ComposerState {
  let changed = false
  const posts = state.posts.map(post => {
    if (!post.media) return post
    if (post.media.kind === 'images') {
      let itemChanged = false
      const items = post.media.items.map(item => {
        if (item.id !== args.mediaId) return item
        itemChanged = true
        return {...item, upload: args.status}
      })
      if (!itemChanged) return post
      changed = true
      return {...post, media: {kind: 'images' as const, items}}
    }
    if (post.media.kind === 'video' && post.media.item.id === args.mediaId) {
      changed = true
      return {
        ...post,
        media: {
          kind: 'video' as const,
          item: {...post.media.item, upload: args.status},
        },
      }
    }
    return post
  })
  if (!changed) return state
  // Upload progress shouldn't itself mark dirty - it's not a user edit.
  return {...state, posts}
}
