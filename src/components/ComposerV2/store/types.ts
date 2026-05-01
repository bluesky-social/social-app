import {type AppBskyFeedDefs, type BlobRef} from '@atproto/api'

import {type Gif} from '#/state/queries/tenor'

/**
 * What an upload reporter (the worker, or a test) sends in. Failed inputs
 * carry just the error string; the store wraps the failure with a bound
 * `retry()` method when it stores the status.
 */
export type UploadStatus =
  | {state: 'pending'}
  | {state: 'uploading'; progress: number}
  | {state: 'uploaded'; blob: BlobRef}
  | {state: 'failed'; error: string}

/**
 * What's stored on a media item. The failed variant has a bound `retry()` so
 * UI can call it directly without having to look up postId/mediaId.
 *
 * Note: `retry` is a function reference and won't survive JSON serialization.
 * On restore (OS-resume / draft load), the store re-attaches it.
 */
export type PostMediaUploadStatus =
  | {state: 'pending'}
  | {state: 'uploading'; progress: number}
  | {state: 'uploaded'; blob: BlobRef}
  | {state: 'failed'; error: string; retry: () => void}

export type PostEmbedMediaImage = {
  id: string
  /** Id of the post this media is attached to. */
  postId: string
  uri: string
  width: number
  height: number
  altText: string
  /**
   * Stable path used to round-trip through saved drafts without re-copying
   * bytes. Set when loaded from a draft, or generated at draft-save time for
   * media that was added during this composer session.
   */
  localRefPath?: string
  upload: PostMediaUploadStatus
}

export type PostEmbedMediaVideo = {
  id: string
  /** Id of the post this media is attached to. */
  postId: string
  uri: string
  width: number
  height: number
  altText: string
  mimeType: string
  /** See PostEmbedMediaImage.localRefPath. */
  localRefPath?: string
  captions: Array<{lang: string; content: string}>
  upload: PostMediaUploadStatus
}

export type PostEmbedMediaGif = {
  id: string
  /** Id of the post this media is attached to. */
  postId: string
  gif: Gif
  altText: string
}

/**
 * A single piece of embedded media. A post's `media` is an array of these.
 * The bsky semantics (up to 4 images OR 1 video OR 1 gif, never mixed) are
 * enforced by the actions that mutate the array, not by this type.
 */
export type PostEmbedMedia =
  | (PostEmbedMediaImage & {kind: 'image'})
  | (PostEmbedMediaVideo & {kind: 'video'})
  | (PostEmbedMediaGif & {kind: 'gif'})

export type PostEmbedExternal = {
  uri: string
}

export type PostEmbedQuote = {
  uri: string
  cid: string
}

export type ThreadPost = {
  text: string
  langs: string[]
  labels: string[]
  media: PostEmbedMedia[]
  external: PostEmbedExternal | undefined
  quote: PostEmbedQuote | undefined
}

export type ThreadReplyTo = {
  uri: string
  cid: string
  authorDid: string
  view?: AppBskyFeedDefs.PostView
}

export type ThreadState = {
  /**
   * Posts keyed by id. Insertion order is the thread order; rely on object
   * key insertion-order semantics for ES2015+. Keys are nanoid strings so
   * they will not be coerced into the integer-key bucket that re-sorts.
   */
  posts: Record<string, ThreadPost>
  /** ID of the saved draft this composer was opened from, if any. */
  draftId: string | undefined
  /** True when local state has diverged from the loaded draft (or initial open state). */
  isDirty: boolean
}
