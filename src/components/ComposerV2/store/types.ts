import {
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type BlobRef,
  type ChatBskyGroupDefs,
  type ComAtprotoRepoStrongRef,
} from '@atproto/api'

import {type ComposerImage} from '#/state/gallery'
import {type Gif} from '#/features/gifPicker/types'

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
 * Coarse classification of why a link resolution failed. Drives UI
 * affordances — for example, `embedding-disabled` is a permanent rejection
 * (embedding the post is forbidden by the author), so the failed variant
 * does not carry a `retry()`. Anything else falls under `unknown` and is
 * retryable.
 */
export type LinkResolutionFailureCode = 'embedding-disabled' | 'unknown'

/**
 * What's stored on a post's `embed` field. The failed variant carries a
 * bound `retry()` for retryable codes; for permanent failures (e.g.
 * `embedding-disabled`) `retry` is omitted so UI can detect that case and
 * surface a non-retryable message. The pending variant is set synchronously
 * by addUri while resolution is in flight; the resolved variants
 * (external/feed/list/starter-pack/chat-invite) land when the worker
 * reports back.
 *
 * Note: `retry` is a function reference and won't survive JSON serialization.
 * On restore (OS-resume / draft load), the store re-attaches it.
 *
 * (Worker-side input and outcome types live in linkResolution.ts.)
 */
export type PostEmbed =
  | {state: 'pending'; uri: string}
  | {
      state: 'failed'
      uri: string
      error: string
      code: LinkResolutionFailureCode
      retry?: () => void
    }
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
  | {
      state: 'chat-invite'
      uri: string
      code: string
      view: ChatBskyGroupDefs.JoinLinkPreviewView | undefined
    }

/**
 * What's stored on a post's `quote` field. Mirrors `PostEmbed`'s shape: the
 * pending variant is set synchronously by addUri while the post is being
 * resolved; the resolved variant lands when the worker reports back; the
 * failed variant carries a bound `retry()`.
 *
 * `view` is optional on the resolved variant because `setQuoteEmbed` (used
 * for direct programmatic insertion, e.g. draft restore) may not have a
 * hydrated post view to hand.
 */
export type PostEmbedQuote =
  | {state: 'pending'; uri: string}
  | {
      state: 'failed'
      uri: string
      error: string
      code: LinkResolutionFailureCode
      retry?: () => void
    }
  | {
      state: 'resolved'
      uri: string
      cid: string
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
