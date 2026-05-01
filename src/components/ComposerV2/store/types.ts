import {
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type BlobRef,
  type ComAtprotoRepoStrongRef,
} from '@atproto/api'

import {type ComposerImage} from '#/state/gallery'
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

/**
 * What a link-resolution reporter (the worker, or a test) sends in. Failed
 * inputs carry just the error string; the store wraps the failure with a
 * bound `retry()` method when it stores the status.
 *
 * `pending` is included so the store can construct the initial pending state
 * with the same type vocabulary, but the worker never emits `pending` - it
 * only emits terminal outcomes (the post-resolution variants and `failed`).
 */
export type EmbedResolution =
  | {state: 'pending'; uri: string}
  | {state: 'failed'; uri: string; error: string}
  | {
      state: 'external'
      uri: string
      title: string
      description: string
      thumb: ComposerImage | undefined
    }
  | {
      state: 'feed'
      record: ComAtprotoRepoStrongRef.Main
      view: AppBskyFeedDefs.GeneratorView
    }
  | {
      state: 'list'
      record: ComAtprotoRepoStrongRef.Main
      view: AppBskyGraphDefs.ListView
    }
  | {
      state: 'starter-pack'
      record: ComAtprotoRepoStrongRef.Main
      view: AppBskyGraphDefs.StarterPackView
    }

/**
 * What's stored on a post's `embed` field. Mirrors PostMediaUploadStatus'
 * shape: the failed variant has a bound `retry()` so UI can call it directly
 * without having to look up the post id.
 *
 * Note: `retry` is a function reference and won't survive JSON serialization.
 * On restore (OS-resume / draft load), the store re-attaches it.
 */
export type PostEmbed =
  | {state: 'pending'; uri: string}
  | {state: 'failed'; uri: string; error: string; retry: () => void}
  | {
      state: 'external'
      uri: string
      title: string
      description: string
      thumb: ComposerImage | undefined
    }
  | {
      state: 'feed'
      record: ComAtprotoRepoStrongRef.Main
      view: AppBskyFeedDefs.GeneratorView
    }
  | {
      state: 'list'
      record: ComAtprotoRepoStrongRef.Main
      view: AppBskyGraphDefs.ListView
    }
  | {
      state: 'starter-pack'
      record: ComAtprotoRepoStrongRef.Main
      view: AppBskyGraphDefs.StarterPackView
    }

/**
 * Worker output for an `addUri` call. The store routes `kind: 'post'` to the
 * post's `quote` field and everything else to the `embed` field.
 */
export type LinkResolutionOutcome =
  | {
      kind: 'post'
      record: ComAtprotoRepoStrongRef.Main
      view: AppBskyFeedDefs.PostView
    }
  | {kind: 'embed'; embed: Exclude<EmbedResolution, {state: 'pending'}>}

export type PostEmbedQuote = {
  uri: string
  cid: string
  /** Hydrated post view; populated when addUri resolves a post. */
  view?: AppBskyFeedDefs.PostView
}

export type ThreadPost = {
  text: string
  langs: string[]
  labels: string[]
  media: PostEmbedMedia[]
  /** Single non-quote embed slot. Mutually exclusive with media. */
  embed: PostEmbed | undefined
  quote: PostEmbedQuote | undefined
  /**
   * Derived from `media`. How many more items of each kind addMedia would
   * accept on this post given the current state. Kept in sync by the store
   * whenever `media` is mutated; UI can read these directly to gate pickers.
   */
  imageSelectionsRemaining: number
  videoSelectionsRemaining: number
  gifSelectionsRemaining: number
}

/**
 * Input shape for addMedia. Each entry carries its own kind discriminator
 * plus the kind-specific source fields. The store generates ids and
 * postIds; callers don't deal with either.
 */
export type AddMediaInput =
  | {
      kind: 'image'
      uri: string
      width: number
      height: number
      altText?: string
    }
  | {
      kind: 'video'
      uri: string
      width: number
      height: number
      mimeType: string
      altText?: string
    }
  | {
      kind: 'gif'
      gif: Gif
      altText?: string
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
