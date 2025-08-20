import {
  type AppBskyEmbedRecord,
  type AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
} from '@atproto/api'
import {type QueryClient} from '@tanstack/react-query'

import {type DELETED_POST} from '#/state/queries/cache/util'

/**
 * Available mutations for a post.
 */
export type PostMutations = {
  likeUri: string | undefined
  repostUri: string | undefined
  isDeleted: boolean
  embed: AppBskyEmbedRecord.View | AppBskyEmbedRecordWithMedia.View | undefined
  pinned: boolean
}

/**
 * Applies mutations to a post.
 */
export type ApplyPostCacheMutator = (params: {
  /**
   * The query client to use for cache updates.
   */
  qc: QueryClient
  /**
   * The URI of the post to mutate.
   */
  uri: string
  /**
   * The mutation function that applies changes to the post.
   */
  mutator: (
    post: AppBskyFeedDefs.PostView,
  ) => AppBskyFeedDefs.PostView | typeof DELETED_POST
}) => void
