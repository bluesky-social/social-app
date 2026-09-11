import {type BlobRef} from '@atproto/lex'

import {type ResolvedLink} from '#/lib/api/resolve'
import {type Gif} from '#/features/gifPicker/types'
import {type app, type com} from '#/lexicons'

/** Status reported by an upload worker. The store attaches retry behavior. */
export type UploadStatus =
  | {state: 'pending'}
  | {state: 'uploading'; progress: number}
  | {state: 'uploaded'; blob: BlobRef}
  | {state: 'failed'; error: string}

/** Runtime retry functions must be reattached when hydrating serialized data. */
export type PostMediaUploadStatus =
  | {state: 'pending'}
  | {state: 'uploading'; progress: number}
  | {state: 'uploaded'; blob: BlobRef}
  | {state: 'failed'; error: string; retry: () => void}

export type PostMediaImage = {
  kind: 'image'
  id: string
  postId: string
  uri: string
  width: number
  height: number
  altText: string
  /** Durable draft path, reused when saving restored media. */
  localRefPath?: string
  upload: PostMediaUploadStatus
}

export type PostMediaVideo = {
  kind: 'video'
  id: string
  postId: string
  uri: string
  width: number
  height: number
  altText: string
  mimeType: string
  /** Durable draft path, reused when saving restored media. */
  localRefPath?: string
  captions: Array<{lang: string; content: string}>
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
      | ({kind: 'external'} & Omit<
          Extract<ResolvedLink, {type: 'external'}>,
          'type'
        >)
      | ({kind: 'chat-invite'} & Omit<
          Extract<ResolvedLink, {type: 'chat-invite'}>,
          'type'
        >)
    ))

/** Record + media becomes recordWithMedia only when constructing a post record. */
export type PostAttachments = {
  record: RecordAttachment | undefined
  media: MediaAttachment | undefined
}

export type ThreadPost = {
  text: string
  langs: string[]
  labels: string[]
  attachments: PostAttachments
  /** Derived from the media slot; record attachments never consume capacity. */
  imageSelectionsRemaining: number
  videoSelectionsRemaining: number
  gifSelectionsRemaining: number
}

/** The store generates item IDs and postIds; callers provide only sources. */
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
  /** Nanoid keys retain insertion order, which is the thread order. */
  posts: Record<string, ThreadPost>
  /** ID of the saved draft this composer was opened from, if any. */
  draftId: string | undefined
  /** Whether a user edit has changed the initial or loaded draft state. */
  isDirty: boolean
}
