/**
 * Types for draft display and local media tracking.
 * Server draft types come from @atproto/api.
 */

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
  /** First ~100 chars of first post */
  previewText: string
  /** Whether the draft has media */
  hasMedia: boolean
  /** Whether some media is missing (saved on another device) */
  hasMissingMedia?: boolean
  /** Number of media items */
  mediaCount: number
  /** Number of posts in thread */
  postCount: number
  /** Whether this is a reply (always false - replies not supported) */
  isReply: boolean
  /** ISO timestamp of last update */
  updatedAt: string
  /** All posts in the draft for full display */
  posts: DraftPostDisplay[]
}
