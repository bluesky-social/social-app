import {AppBskyFeedDefs, AppBskyFeedThreadgate} from '@atproto/api'

export type ThreadgateSetting =
  | {type: 'nobody'}
  | {type: 'mention'}
  | {type: 'following'}
  | {type: 'list'; list: unknown}

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
  const settings: ThreadgateSetting[] = record.allow
    .map(allow => {
      let setting: ThreadgateSetting | undefined
      if (allow.$type === 'app.bsky.feed.threadgate#mentionRule') {
        setting = {type: 'mention'}
      } else if (allow.$type === 'app.bsky.feed.threadgate#followingRule') {
        setting = {type: 'following'}
      } else if (allow.$type === 'app.bsky.feed.threadgate#listRule') {
        setting = {type: 'list', list: allow.list}
      }
      return setting
    })
    .filter(n => !!n)
  return settings
}
