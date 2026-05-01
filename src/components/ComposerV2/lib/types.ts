/**
 * Types for the ComposerV2 store.
 *
 * The store holds the in-progress state of a thread the user is composing:
 * one or more posts, each with text, optional media (images, video, or a gif),
 * an optional external link card, an optional quote, and labels. Which post
 * has UI focus is purely a view-layer concern and lives outside the store.
 *
 * Media uploads are first-class state. A background worker writes upload
 * progress directly into the relevant media item via setUploadStatus, so
 * components subscribed to that slice rerender without coordination.
 */
import {type AppBskyFeedDefs, type BlobRef} from '@atproto/api'

import {type Gif} from '#/state/queries/tenor'

export type UploadStatus =
  | {state: 'pending'}
  | {state: 'uploading'; progress: number}
  | {state: 'uploaded'; blob: BlobRef}
  | {state: 'failed'; error: string}

export type ImageItem = {
  id: string
  uri: string
  width: number
  height: number
  altText: string
  /** Stable path used to round-trip through saved drafts without re-copying bytes. */
  localRefPath: string
  upload: UploadStatus
}

export type VideoItem = {
  id: string
  uri: string
  width: number
  height: number
  altText: string
  mimeType: string
  localRefPath: string
  captions: Array<{lang: string; content: string}>
  upload: UploadStatus
}

export type GifItem = {
  id: string
  gif: Gif
  altText: string
}

export type PostMedia =
  | {kind: 'images'; items: ImageItem[]}
  | {kind: 'video'; item: VideoItem}
  | {kind: 'gif'; item: GifItem}

export type ExternalEmbed = {
  uri: string
}

export type Quote = {
  uri: string
  cid: string
}

export type PostDraft = {
  id: string
  text: string
  langs: string[]
  labels: string[]
  media: PostMedia | undefined
  external: ExternalEmbed | undefined
  quote: Quote | undefined
}

export type ReplyTo = {
  uri: string
  cid: string
  authorDid: string
  view?: AppBskyFeedDefs.PostView
}

export type ComposerState = {
  posts: PostDraft[]
  replyTo: ReplyTo | undefined
  /** ID of the saved draft this composer was opened from, if any. */
  draftId: string | undefined
  /** True when local state has diverged from the loaded draft (or initial open state). */
  isDirty: boolean
}

export type NewImageInput = {
  uri: string
  width: number
  height: number
  altText?: string
}

export type NewVideoInput = {
  uri: string
  width: number
  height: number
  mimeType: string
  altText?: string
}
