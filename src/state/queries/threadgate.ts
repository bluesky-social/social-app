import {AppBskyFeedDefs, AppBskyFeedThreadgate} from '@atproto/api'

export type ThreadgateSetting =
  | {type: 'nobody'}
  | {type: 'mention'}
  | {type: 'following'}
  | {type: 'list'; list: string}

export function threadgateViewToSettings(
  threadgate: AppBskyFeedDefs.ThreadgateView | undefined,
): ThreadgateSetting[] {
  const record =
    threadgate &&
    AppBskyFeedThreadgate.isRecord(threadgate.record) &&
    AppBskyFeedThreadgate.validateRecord(threadgate.record).success
      ? threadgate.record
      : null
  if (!record) {
    return []
  }
  if (!record.allow?.length) {
    return [{type: 'nobody'}]
  }
  return record.allow
    .map(allow => {
      if (allow.$type === 'app.bsky.feed.threadgate#mentionRule') {
        return {type: 'mention'}
      }
      if (allow.$type === 'app.bsky.feed.threadgate#followingRule') {
        return {type: 'following'}
      }
      if (allow.$type === 'app.bsky.feed.threadgate#listRule') {
        return {type: 'list', list: allow.list}
      }
      return undefined
    })
    .filter(Boolean) as ThreadgateSetting[]
}
