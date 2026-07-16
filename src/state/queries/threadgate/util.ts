import {type AtUriString, toDatetimeString} from '@atproto/syntax'

import {type ThreadgateAllowUISetting} from '#/state/queries/threadgate/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

export function threadgateViewToAllowUISetting(
  threadgateView: app.bsky.feed.defs.ThreadgateView | undefined,
): ThreadgateAllowUISetting[] {
  // Validate the record for clarity, since backwards compat code is a little confusing
  const threadgate =
    threadgateView &&
    bsky.matches(app.bsky.feed.threadgate, threadgateView.record)
      ? threadgateView.record
      : undefined
  return threadgateRecordToAllowUISetting(threadgate)
}

/**
 * Converts a full {@link app.bsky.feed.threadgate.Main} to a list of
 * {@link ThreadgateAllowUISetting}, for use by app UI.
 */
export function threadgateRecordToAllowUISetting(
  threadgate: app.bsky.feed.threadgate.Main | undefined,
): ThreadgateAllowUISetting[] {
  /*
   * If `threadgate` doesn't exist (default), or if `threadgate.allow === undefined`, it means
   * anyone can reply.
   *
   * If `threadgate.allow === []` it means no one can reply, and we translate to UI code
   * here. This was a historical choice, and we have no lexicon representation
   * for 'replies disabled' other than an empty array.
   */
  if (!threadgate || threadgate.allow === undefined) {
    return [{type: 'everybody'}]
  }
  if (threadgate.allow.length === 0) {
    return [{type: 'nobody'}]
  }

  const settings: ThreadgateAllowUISetting[] = threadgate.allow
    .map(allow => {
      let setting: ThreadgateAllowUISetting | undefined
      if (bsky.isType(app.bsky.feed.threadgate.mentionRule, allow)) {
        setting = {type: 'mention'}
      } else if (bsky.isType(app.bsky.feed.threadgate.followingRule, allow)) {
        setting = {type: 'following'}
      } else if (bsky.isType(app.bsky.feed.threadgate.listRule, allow)) {
        setting = {type: 'list', list: allow.list}
      } else if (bsky.isType(app.bsky.feed.threadgate.followerRule, allow)) {
        setting = {type: 'followers'}
      }
      return setting
    })
    .filter(n => !!n)
  return settings
}

/**
 * Converts an array of {@link ThreadgateAllowUISetting} to the `allow` prop on
 * {@link app.bsky.feed.threadgate.Main}.
 *
 * If the `allow` property on the record is undefined, we infer that to mean
 * that everyone can reply. If it's an empty array, we infer that to mean that
 * no one can reply.
 */
export function threadgateAllowUISettingToAllowRecordValue(
  threadgate: ThreadgateAllowUISetting[],
): app.bsky.feed.threadgate.Main['allow'] {
  if (threadgate.find(v => v.type === 'everybody')) {
    return undefined
  }

  let allow: Exclude<app.bsky.feed.threadgate.Main['allow'], undefined> = []

  if (!threadgate.find(v => v.type === 'nobody')) {
    for (const rule of threadgate) {
      if (rule.type === 'mention') {
        allow.push({$type: 'app.bsky.feed.threadgate#mentionRule'})
      } else if (rule.type === 'following') {
        allow.push({$type: 'app.bsky.feed.threadgate#followingRule'})
      } else if (rule.type === 'followers') {
        allow.push({$type: 'app.bsky.feed.threadgate#followerRule'})
      } else if (rule.type === 'list') {
        allow.push({
          $type: 'app.bsky.feed.threadgate#listRule',
          list: rule.list as AtUriString,
        })
      }
    }
  }

  return allow
}

/**
 * Merges two {@link app.bsky.feed.threadgate.Main} objects, combining their
 * `allow` and `hiddenReplies` arrays and de-deduplicating them.
 *
 * Note: `allow` can be undefined here, be sure you don't accidentally set it
 * to an empty array. See other comments in this file.
 */
export function mergeThreadgateRecords(
  prev: app.bsky.feed.threadgate.Main,
  next: Omit<Partial<app.bsky.feed.threadgate.Main>, 'hiddenReplies'> & {
    hiddenReplies?: string[]
  },
): app.bsky.feed.threadgate.Main {
  // can be undefined if everyone can reply!
  const allow: app.bsky.feed.threadgate.Main['allow'] | undefined =
    prev.allow || next.allow
      ? [...(prev.allow || []), ...(next.allow || [])].filter(
          (v, i, a) => a.findIndex(t => t.$type === v.$type) === i,
        )
      : undefined
  const hiddenReplies = Array.from(
    new Set([...(prev.hiddenReplies || []), ...(next.hiddenReplies || [])]),
  ) as AtUriString[]

  return createThreadgateRecord({
    post: prev.post,
    allow, // can be undefined!
    hiddenReplies,
  })
}

/**
 * Create a new {@link app.bsky.feed.threadgate.Main} object with the given
 * properties. `post` is accepted as a plain string (callers hold raw AT-URIs)
 * and asserted to the branded `AtUriString` here.
 */
export function createThreadgateRecord(
  threadgate: Omit<
    Partial<app.bsky.feed.threadgate.Main>,
    'post' | 'hiddenReplies'
  > & {
    post?: string
    hiddenReplies?: string[]
  },
): app.bsky.feed.threadgate.Main {
  if (!threadgate.post) {
    throw new Error('Cannot create a threadgate record without a post URI')
  }

  return {
    $type: 'app.bsky.feed.threadgate',
    post: threadgate.post as AtUriString,
    createdAt: toDatetimeString(new Date()),
    allow: threadgate.allow, // can be undefined!
    hiddenReplies: (threadgate.hiddenReplies || []) as AtUriString[],
  }
}
