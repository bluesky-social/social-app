import {AppBskyFeedDefs, AppBskyFeedThreadgate} from '@atproto/api'

import {ThreadgateAllowUISetting} from '#/state/queries/threadgate/types'

/**
 * Converts a full {@link AppBskyFeedThreadgate.Record} to a list of
 * {@link ThreadgateAllowUISetting}, for use by app UI.
 */
export function threadgateViewToAllowUISetting(
  threadgate: AppBskyFeedDefs.ThreadgateView | undefined,
): ThreadgateAllowUISetting[] {
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
  const settings: ThreadgateAllowUISetting[] = record.allow
    .map(allow => {
      let setting: ThreadgateAllowUISetting | undefined
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

/**
 * Converts a list of {@link ThreadgateAllowUISetting} to the `allow` prop on
 * {@link AppBskyFeedThreadgate.Record},
 */
export function threadgateAllowUISettingToAllowType(
  threadgate: ThreadgateAllowUISetting[],
) {
  let allow: (
    | AppBskyFeedThreadgate.MentionRule
    | AppBskyFeedThreadgate.FollowingRule
    | AppBskyFeedThreadgate.ListRule
  )[] = []

  if (!threadgate.find(v => v.type === 'nobody')) {
    for (const rule of threadgate) {
      if (rule.type === 'mention') {
        allow.push({$type: 'app.bsky.feed.threadgate#mentionRule'})
      } else if (rule.type === 'following') {
        allow.push({$type: 'app.bsky.feed.threadgate#followingRule'})
      } else if (rule.type === 'list') {
        allow.push({
          $type: 'app.bsky.feed.threadgate#listRule',
          list: rule.list,
        })
      }
    }
  }

  return allow
}

/**
 * Merges two {@link AppBskyFeedThreadgate.Record} objects, combining their
 * `allow` and `hiddenReplies` arrays and de-deduplicating them.
 */
export function mergeThreadgateRecords(
  prev: AppBskyFeedThreadgate.Record,
  next: Partial<AppBskyFeedThreadgate.Record>,
): AppBskyFeedThreadgate.Record {
  const allow = [...(prev.allow || []), ...(next.allow || [])].filter(
    (v, i, a) => a.findIndex(t => t.$type === v.$type) === i,
  )
  const hiddenReplies = Array.from(
    new Set([...(prev.hiddenReplies || []), ...(next.hiddenReplies || [])]),
  )

  return createThreadgateRecord({
    post: prev.post,
    allow,
    hiddenReplies,
  })
}

export function createThreadgateRecord(
  threadgate: Partial<AppBskyFeedThreadgate.Record>,
): AppBskyFeedThreadgate.Record {
  if (!threadgate.post) {
    throw new Error('Cannot create a threadgate record without a post URI')
  }

  return {
    $type: 'app.bsky.feed.threadgate',
    post: threadgate.post,
    createdAt: new Date().toISOString(),
    allow: threadgate.allow || [],
    hiddenReplies: threadgate.hiddenReplies || [],
  }
}
