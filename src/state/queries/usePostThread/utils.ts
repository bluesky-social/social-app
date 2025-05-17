import {
  APP_BSKY_UNSPECCED,
  AppBskyFeedThreadgate,
  type AppBskyUnspeccedGetPostThreadV2,
} from '@atproto/api'

import {type PostThreadParams} from '#/state/queries/usePostThread/types'
import * as bsky from '#/types/bsky'

export function mapSortOptionsToSortID(sort: PostThreadParams['sort']) {
  switch (sort) {
    case 'hotness':
      return APP_BSKY_UNSPECCED.GetPostThreadV2Hotness
    case 'oldest':
      return APP_BSKY_UNSPECCED.GetPostThreadV2Oldest
    case 'newest':
      return APP_BSKY_UNSPECCED.GetPostThreadV2Newest
    case 'most-likes':
      return APP_BSKY_UNSPECCED.GetPostThreadV2MostLikes
    default:
      return APP_BSKY_UNSPECCED.GetPostThreadV2Hotness
  }
}

export function getThreadgateRecord(
  view: AppBskyUnspeccedGetPostThreadV2.OutputSchema['threadgate'],
) {
  return bsky.dangerousIsType<AppBskyFeedThreadgate.Record>(
    view?.record,
    AppBskyFeedThreadgate.isRecord,
  )
    ? view?.record
    : undefined
}
