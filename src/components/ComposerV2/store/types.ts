import {type BlobRef, type Client} from '@atproto/lex'
import {type I18n} from '@lingui/core'

import {type ResolvedLink} from '#/lib/api/resolve'
import {type ComposerV2ErrorKind} from '#/components/ComposerV2/errors'
import {type Gif} from '#/features/gifPicker/types'
import {type app, type com} from '#/lexicons'

/** A real media worker phase. Compression has no percentage on native images. */
export type UploadPhase =
  'validating' | 'compressing' | 'uploading' | 'processing' | 'captions'

/** Status reported by an upload worker. The store attaches retry behavior. */
export type UploadStatus =
  | {state: 'pending'}
  | {
      state: 'uploading'
      phase?: UploadPhase
      progress?: number
    }
  | {
      state: 'uploaded'
      blob: BlobRef
      captionBlobs?: UploadedCaption[]
    }
  | {
      state: 'failed'
      error: string
      code?: string
      retryable?: boolean
      blob?: BlobRef
      captionBlobs?: UploadedCaption[]
    }

type FailedPostMediaUploadStatus = {
  state: 'failed'
  error: string
  code?: string
  blob?: BlobRef
  captionBlobs?: UploadedCaption[]
} & ({retryable: true; retry: () => void} | {retryable: false; retry?: never})

/** Runtime retry functions must be reattached when hydrating serialized data. */
export type PostMediaUploadStatus =
  | {state: 'pending'}
  | {
      state: 'uploading'
      phase?: UploadPhase
      progress?: number
    }
  | {
      state: 'uploaded'
      blob: BlobRef
      captionBlobs?: UploadedCaption[]
    }
  | FailedPostMediaUploadStatus

export type UploadedCaption = {lang: string; blob: BlobRef}

/**
 * Planning metadata for an image upload, from the compressor's output. The
 * output file itself is released once its upload settles, so no URI is kept.
 */
export type PreparedImage = {
  width: number
  height: number
  mimeType: string
  aspectRatio: {width: number; height: number}
  size?: number
}

/**
 * Display and planning metadata for a video upload (the planner prefers it over
 * the item's source fields). `size` and `mimeType` describe the compressed
 * output; `width`, `height`, and `aspectRatio` are the source's display
 * dimensions, because the shared `CompressedVideo` contract carries no output
 * dimensions. It is not the reusable result and carries no output URI: retries
 * read the store's private compression cache, which also holds the output's
 * location, the web `bytes`, and the passthrough reason this type omits so
 * published state stays small.
 */
export type PreparedVideo = {
  size: number
  mimeType: string
  width: number
  height: number
  aspectRatio: {width: number; height: number}
}

/**
 * Source metadata an upload worker prepared. The store fills only fields the
 * item did not know and never overwrites a known value, so a retry of the same
 * item reuses them instead of reading the source again. Durations are in
 * milliseconds.
 */
export type ResolvedSourceMetadata = {
  width?: number
  height?: number
  mimeType?: string
  duration?: number
  fileSize?: number
}

/**
 * The readable source fields of an image: what the worker compresses and what
 * `replaceImageSource` swaps in. Unknown values are left out, not guessed.
 */
export type PostMediaImageSource = {
  /** Native file URI, or a web data/object URL. */
  uri: string
  width?: number
  height?: number
  mimeType?: string
  /** Source byte size, when known. */
  fileSize?: number
}

export type PostMediaImage = {
  kind: 'image'
  id: string
  postId: string
  /**
   * The current source: what the worker compresses and previews show. It
   * changes only through `replaceImageSource`.
   */
  uri: string
  /** Unknown source dimensions are resolved by the worker before compression. */
  width?: number
  height?: number
  altText: string
  /** The source MIME type, before post-image compression. */
  mimeType?: string
  /** Source byte size, when known. */
  fileSize?: number
  /**
   * The source the item had before its first `replaceImageSource`, kept so an
   * editor can crop from it again or reset. Absent until an edit; never
   * replaced by later edits and cleared by a reset. Crop state itself lives
   * outside the store.
   */
  original?: PostMediaImageSource
  /** Durable draft path, reused when saving restored media. */
  localRefPath?: string
  /** Output of the post image compressor; the source fields remain unchanged. */
  prepared?: PreparedImage
  upload: PostMediaUploadStatus
}

export type PostMediaVideo = {
  kind: 'video'
  id: string
  postId: string
  uri: string
  /** Unknown source metadata is resolved by the worker before compression. */
  width?: number
  height?: number
  altText: string
  /** `image/gif` marks an animated GIF file using the video pipeline. */
  mimeType?: string
  /** Source duration in milliseconds. */
  duration?: number
  /** Source byte size, when known. */
  fileSize?: number
  /** Durable draft path, reused when saving restored media. */
  localRefPath?: string
  /** Web picker input retained for metadata/compression; never serialized to drafts. */
  file?: Blob
  captions: Array<{lang: string; content: string}>
  /** Uploaded caption refs are kept separate from editable caption contents. */
  captionBlobs: UploadedCaption[]
  /**
   * Planning metadata for the upload, kept apart from the source fields above.
   * Its dimensions are the source's, not the compressed output's. Not what a
   * retry reuses; see `PreparedVideo`.
   */
  prepared?: PreparedVideo
  /** A completed video is retained when a later caption upload fails. */
  videoBlob?: BlobRef
  upload: PostMediaUploadStatus
}

export type PostMediaGif = {
  kind: 'gif'
  id: string
  postId: string
  gif: Gif
  altText: string
}

/** Individually editable media items with stable upload ownership. */
export type PostMediaItem = PostMediaImage | PostMediaVideo | PostMediaGif

/** Embedding-disabled is permanent; unknown failures can be retried. */
export type LinkResolutionFailureCode = 'embedding-disabled' | 'unknown'

/** Pending and failed URI candidates reserve their target attachment slot. */
export type AttachmentResolution =
  | {state: 'pending'; uri: string}
  | {
      state: 'failed'
      uri: string
      /** Safe fallback; UI localizes code instead of rendering exception text. */
      error: string
      code: LinkResolutionFailureCode
      /** Omitted for permanent failures; not serializable. */
      retry?: () => void
    }

/** A quote is a post-kind record, sharing this slot with other record kinds. */
export type RecordAttachmentValue = {
  record: com.atproto.repo.strongRef.Main
} & (
  | {kind: 'post'; view?: app.bsky.feed.defs.PostView}
  | {kind: 'feed'; view?: app.bsky.feed.defs.GeneratorView}
  | {kind: 'list'; view?: app.bsky.graph.defs.ListView}
  | {kind: 'starter-pack'; view?: app.bsky.graph.defs.StarterPackView}
)

export type RecordAttachment =
  AttachmentResolution | ({state: 'resolved'} & RecordAttachmentValue)

/** Already-resolved card metadata, shared by live state and initial inputs. */
export type MediaCardValue =
  | ({kind: 'external'} & Omit<
      Extract<ResolvedLink, {type: 'external'}>,
      'type'
    >)
  | ({kind: 'chat-invite'} & Omit<
      Extract<ResolvedLink, {type: 'chat-invite'}>,
      'type'
    >)

/**
 * One media embed. Images form one attachment; video and GIF are single items.
 * External cards and chat invites share this slot with user-selected media.
 * Resolved means the attachment kind is known; item uploads may still be pending.
 */
export type MediaAttachment =
  | AttachmentResolution
  | ({state: 'resolved'} & (
      | {kind: 'images'; items: PostMediaImage[]}
      | {kind: 'video'; item: PostMediaVideo}
      | {kind: 'gif'; item: PostMediaGif}
      | MediaCardValue
    ))

/** Record + media becomes recordWithMedia only when constructing a post record. */
export type PostAttachments = {
  record: RecordAttachment | undefined
  media: MediaAttachment | undefined
}

/** A protocol threadgate rule, including unknown future typed rules. */
export type ThreadgateAllowRule = NonNullable<
  app.bsky.feed.threadgate.Main['allow']
>[number]

/** A protocol postgate rule, including unknown future typed rules. */
export type PostgateEmbeddingRule = NonNullable<
  app.bsky.feed.postgate.Main['embeddingRules']
>[number]

/** Serializable preview data for the post this thread is replying to. */
export type ThreadReplyTarget = {
  uri: string
  cid: string
  text: string
  langs: string[]
  author: app.bsky.actor.defs.ProfileViewBasic
  embed?: app.bsky.feed.defs.PostView['embed']
}

export type ThreadPost = {
  text: string
  langs: string[]
  labels: string[]
  /** Explicit post tags; these are separate from rich-text hashtag facets. */
  tags: string[]
  attachments: PostAttachments
  /** Derived from the media slot; record attachments never consume capacity. */
  imageSelectionsRemaining: number
  videoSelectionsRemaining: number
  gifSelectionsRemaining: number
}

/**
 * Local image data without runtime identity or upload status. Pass whatever
 * metadata the source already has; the worker resolves missing dimensions
 * before compression rather than requiring callers to probe.
 */
export type PostMediaImageInput = {
  /** Native file URI, or a web data/object URL. */
  uri: string
  width?: number
  height?: number
  mimeType?: string
  /** Source byte size, when known. */
  fileSize?: number
  altText?: string
  localRefPath?: string
}

/**
 * Local video data and durable caption contents, not uploaded caption blobs.
 * Missing MIME type, dimensions, duration, or size are resolved by the worker,
 * which probes only when a cheaper source cannot supply them.
 */
export type PostMediaVideoInput = {
  /** Native file URI, or a web data/object URL. */
  uri: string
  width?: number
  height?: number
  /** `image/gif` routes an animated GIF file through the video pipeline. */
  mimeType?: string
  altText?: string
  localRefPath?: string
  /** Native callers use uri; web callers may also provide the picker File. */
  file?: Blob
  /** Source duration in milliseconds. */
  duration?: number
  /** Source byte size, when known. */
  fileSize?: number
  captions?: ReadonlyArray<{lang: string; content: string}>
}

export type PostMediaGifInput = {
  gif: Gif
  altText?: string
}

/** The store generates item IDs and postIds; callers provide only sources. */
export type AddMediaInput =
  | ({kind: 'image'} & PostMediaImageInput)
  | ({kind: 'video'} & PostMediaVideoInput)
  | ({kind: 'gif'} & PostMediaGifInput)

/** A source adapter has chosen the slot, but the URI still needs resolution. */
export type UriAttachmentInput = {kind: 'uri'; uri: string}

export type RecordAttachmentInput = RecordAttachmentValue | UriAttachmentInput

export type MediaAttachmentInput =
  | {kind: 'images'; items: readonly PostMediaImageInput[]}
  | {kind: 'video'; item: PostMediaVideoInput}
  | {kind: 'gif'; item: PostMediaGifInput}
  | MediaCardValue
  | UriAttachmentInput

/** Input for one post. Omitted fields default to an empty post. */
export type ThreadPostInitialState = {
  text?: string
  langs?: readonly string[]
  labels?: readonly string[]
  /** Explicit post tags; draft schemas currently cannot persist these. */
  tags?: readonly string[]
  attachments?: {
    record?: RecordAttachmentInput
    media?: MediaAttachmentInput
  }
}

/**
 * Shared initial-data contract for source adapters (ComposerOpts, saved drafts).
 * Adapters may share immutable source values while normalizing. The store
 * copies incoming editable data at construction, and published snapshots are
 * read-only to callers. Runtime IDs, task handles, retries, upload statuses,
 * and derived values are generated by the store.
 */
export type ThreadStoreInitialState = {
  /** Ordered inputs. Omitted or empty posts create one empty post. */
  posts?: readonly ThreadPostInitialState[]
  /** Parent preview for a reply; the submission layer resolves any root. */
  replyTo?: ThreadReplyTarget
  /** Undefined means everybody may reply; an empty array means nobody may. */
  threadgateAllowRules?: readonly ThreadgateAllowRule[]
  /** Empty or omitted rules allow quoting; unknown rules are retained. */
  postgateEmbeddingRules?: readonly PostgateEmbeddingRule[]
  draftId?: string
  /** Defaults to false; true can explicitly restore an unsaved composition. */
  isDirty?: boolean
}

export type ThreadState = {
  /** Nanoid keys retain insertion order, which is the thread order. */
  posts: Record<string, ThreadPost>
  /** Parent preview for a reply; the submission layer resolves any root. */
  replyTo: ThreadReplyTarget | undefined
  /** Undefined means everybody may reply; an empty array means nobody may. */
  threadgateAllowRules: ThreadgateAllowRule[] | undefined
  /** Empty rules allow quoting; unknown rules are retained. */
  postgateEmbeddingRules: PostgateEmbeddingRule[]
  /** ID of the saved draft this composer was opened from, if any. */
  draftId: string | undefined
  /** Whether a user edit has changed the initial or loaded draft state. */
  isDirty: boolean
}

/** How an upload status change was classified, kept for error reporting. */
export type UploadDiagnostic = {kind: ComposerV2ErrorKind; cause: unknown}

/** Account-scoped inputs every real upload needs. */
export type UploadRuntime = {
  pdsClient: Client
  /**
   * The account's PDS URL. Video uploads derive the service-auth audience for
   * `com.atproto.repo.uploadBlob` from it; the lex client does not expose it.
   */
  pdsUrl: string
  i18n: I18n
}
