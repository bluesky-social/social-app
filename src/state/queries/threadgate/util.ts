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
  /*
   * If record doesn't exist (default), or if `record.allow === undefined`, it means
   * anyone can reply.
   *
   * If `record.allow === []` it means no one can reply, and we translate to UI code
   * here. This was a historical choice, and we have no lexicon representation
   * for 'replies disabled' other than an empty array.
   */
  if (!record || record.allow === undefined) {
    return []
  }
  if (record.allow.length === 0) {
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
 * Converts an array of {@link ThreadgateAllowUISetting} to the `allow` prop on
 * {@link AppBskyFeedThreadgate.Record}.
 *
 * If the array passed is empty, we infer that to mean anyone can reply, and
 * return undefined. An undefined value in the record is interpretted as anyone
 * can reply, whereas an empty array means no on can reply.
 */
export function threadgateAllowUISettingToAllowRecordValue(
  threadgate: ThreadgateAllowUISetting[],
): AppBskyFeedThreadgate.Record['allow'] {
  if (threadgate.length === 0) return undefined

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

/**
 * Create a new {@link AppBskyFeedThreadgate.Record} object with the given
 * properties.
 *
 * Note: setting `allow` to `undefined` resets and allows everyone to reply. An
 * empty array means that no one can reply. This is a bit of a hack bc of how
 * these were designed, but should be fine as long as we're careful.
 */
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
    allow: threadgate.allow, // can be undefined!
    hiddenReplies: threadgate.hiddenReplies || [],
  }
}
