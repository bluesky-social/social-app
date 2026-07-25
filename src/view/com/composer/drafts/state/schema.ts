/**
 * Types for draft display and local media tracking.
 * Server draft types come from @atproto/api.
 */
import {type AppBskyDraftDefs} from '@atproto/api'

/**
 * Reference to locally cached media file for display
 */
export type LocalMediaDisplay = {
  /** Path stored in server draft (used as key for local lookup) */
  localPath: string
  /** Alt text */
  altText: string
  /** Whether the local file exists on this device */
  exists: boolean
}

/**
 * GIF display data (parsed from external embed URL)
 */
export type GifDisplay = {
  /** Full URL with dimensions */
  url: string
  /** Width */
  width: number
  /** Height */
  height: number
  /** Alt text */
  alt: string
}

/**
 * Post content for display in draft list
 */
export type DraftPostDisplay = {
  id: string
  /** Full text content */
  text: string
  /** Image references for display */
  images?: LocalMediaDisplay[]
  /** Video reference */
  video?: LocalMediaDisplay
  /** GIF data (from URL) */
  gif?: GifDisplay
}

/**
 * Draft summary for list display
 */
export type DraftSummary = {
  id: string
  /** ISO timestamp of creation */
  createdAt: string
  /** ISO timestamp of last update */
  updatedAt: string
  /** The full draft data from the server */
  draft: AppBskyDraftDefs.Draft
  /** All posts in the draft for full display */
  posts: DraftPostDisplay[]
  /** Metadata about the draft for display purposes */
  meta: {
    /** Whether this device is the originating device for the draft */
    isOriginatingDevice: boolean
    /** Number of posts in thread */
    postCount: number
    /** Number of replies to anchor post */
    replyCount: number
    /** Whether the draft has media */
    hasMedia: boolean
    /** Whether some media is missing (saved on another device) */
    hasMissingMedia?: boolean
    /** Number of media items */
    mediaCount: number
    /** Whether any posts in the draft has quotes */
    hasQuotes: boolean
    /** Number of quotes in the draft */
    quoteCount: number
  }
}
