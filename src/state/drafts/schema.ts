import {type AppBskyFeedPostgate, type AppBskyRichtextFacet} from '@atproto/api'

import {type ThreadgateAllowUISetting} from '#/state/queries/threadgate'

/**
 * Reference to locally stored media (image or video)
 */
export type LocalMediaRef = {
  /** UUID for local storage key */
  localId: string
  type: 'image' | 'video'
  mimeType: string
  width: number
  height: number
  altText: string
}

/**
 * Stored GIF metadata (re-fetchable from Tenor)
 */
export type StoredGif = {
  /** Tenor GIF ID */
  tenorId: string
  /** URL for the GIF */
  url: string
  /** Dimensions */
  width: number
  height: number
  /** Alt text */
  altText: string
}

/**
 * Serializable version of RichText
 */
export type StoredRichText = {
  text: string
  facets?: AppBskyRichtextFacet.Main[]
}

/**
 * Serializable version of PostDraft for storage
 */
export type StoredPostDraft = {
  id: string
  richtext: StoredRichText
  labels: string[]
  /** Quote post URI */
  quoteUri?: string
  /** External link URI (for link card) */
  linkUri?: string
  /** Locally stored images */
  images?: LocalMediaRef[]
  /** Locally stored video */
  video?: LocalMediaRef & {
    /** Captions for the video */
    captions?: Array<{lang: string; localId: string}>
  }
  /** GIF metadata (re-fetchable from Tenor) */
  gif?: StoredGif
}

/**
 * Full draft including thread structure
 */
export type StoredDraft = {
  /** Local draft UUID */
  id: string
  /** Owner account DID */
  accountDid: string
  /** ISO timestamp of creation */
  createdAt: string
  /** ISO timestamp of last update */
  updatedAt: string
  /** If this is a reply, the URI of the parent post */
  replyToUri?: string
  /** Reply parent author info (for display) */
  replyToAuthor?: {
    did: string
    handle: string
    displayName?: string
  }
  /** Thread posts */
  posts: StoredPostDraft[]
  /** Post interaction settings */
  postgate?: AppBskyFeedPostgate.Record
  /** Thread interaction settings */
  threadgate?: ThreadgateAllowUISetting[]
  /** Server draft ID (if synced) */
  serverDraftId?: string
  /** Sync status */
  syncStatus: 'local' | 'synced' | 'dirty'
}

/**
 * Draft summary for list display
 */
export type DraftSummary = {
  id: string
  /** First ~100 chars of first post */
  previewText: string
  /** Whether the draft has media */
  hasMedia: boolean
  /** Number of media items */
  mediaCount: number
  /** Number of posts in thread */
  postCount: number
  /** Whether this is a reply */
  isReply: boolean
  /** Reply to author handle (if reply) */
  replyToHandle?: string
  /** ISO timestamp of last update */
  updatedAt: string
}
