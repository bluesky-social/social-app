import {embeddingRules} from '#/state/queries/postgate/util'
import {type ThreadgateAllowUISetting} from '#/state/queries/threadgate/types'
import {threadgateAllowUISettingToAllowRecordValue} from '#/state/queries/threadgate/util'
import {
  type PostgateEmbeddingRule,
  type ThreadgateAllowRule,
} from '#/components/ComposerV2/store/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/**
 * Split stored threadgate allow rules into the settings the shared gate
 * dialog can edit and the unknown typed rules it cannot represent. Unknown
 * rules are preserved separately so an edit to the known settings never
 * silently drops them.
 */
export function splitThreadgateAllowRules({
  rules,
}: {
  rules: readonly ThreadgateAllowRule[] | undefined
}): {
  settings: ThreadgateAllowUISetting[]
  unknownRules: ThreadgateAllowRule[]
} {
  if (rules === undefined) {
    return {settings: [{type: 'everybody'}], unknownRules: []}
  }
  if (rules.length === 0) {
    return {settings: [{type: 'nobody'}], unknownRules: []}
  }
  const settings: ThreadgateAllowUISetting[] = []
  const unknownRules: ThreadgateAllowRule[] = []
  for (const rule of rules) {
    if (bsky.isType(app.bsky.feed.threadgate.mentionRule, rule)) {
      settings.push({type: 'mention'})
    } else if (bsky.isType(app.bsky.feed.threadgate.followingRule, rule)) {
      settings.push({type: 'following'})
    } else if (bsky.isType(app.bsky.feed.threadgate.followerRule, rule)) {
      settings.push({type: 'followers'})
    } else if (bsky.isType(app.bsky.feed.threadgate.listRule, rule)) {
      settings.push({type: 'list', list: rule.list})
    } else {
      unknownRules.push(rule)
    }
  }
  return {settings, unknownRules}
}

/**
 * Convert edited gate-dialog settings back to threadgate allow rules while
 * preserving unknown rules.
 *
 * - Specific selections keep the unknown rules alongside them.
 * - "Everybody" cannot be represented while unknown rules restrict replies,
 *   so preserved unknown rules remain the entire rule set; the tester
 *   surfaces this and offers an explicit control to discard them.
 * - "Nobody" is an explicit edit to the narrowest setting and returns an
 *   empty rule set, which never broadens permissions.
 */
export function mergeThreadgateAllowRules({
  settings,
  unknownRules,
}: {
  settings: ThreadgateAllowUISetting[]
  unknownRules: readonly ThreadgateAllowRule[]
}): ThreadgateAllowRule[] | undefined {
  if (settings.some(setting => setting.type === 'nobody')) {
    return []
  }
  const known = threadgateAllowUISettingToAllowRecordValue(settings)
  if (known === undefined) {
    return unknownRules.length > 0 ? [...unknownRules] : undefined
  }
  return [...known, ...unknownRules]
}

/**
 * Split stored postgate embedding rules into the quote toggle the shared
 * dialog edits and the unknown typed rules it cannot represent.
 */
export function splitPostgateEmbeddingRules({
  rules,
}: {
  rules: readonly PostgateEmbeddingRule[]
}): {
  quotesEnabled: boolean
  unknownRules: PostgateEmbeddingRule[]
} {
  let quotesEnabled = true
  const unknownRules: PostgateEmbeddingRule[] = []
  for (const rule of rules) {
    if (rule.$type === embeddingRules.disableRule.$type) {
      quotesEnabled = false
    } else {
      unknownRules.push(rule)
    }
  }
  return {quotesEnabled, unknownRules}
}

/**
 * Convert the edited quote toggle back to postgate embedding rules. Unknown
 * rules are restrictions, so they are always preserved; dropping them would
 * silently broaden what other users may do with the post.
 */
export function mergePostgateEmbeddingRules({
  quotesEnabled,
  unknownRules,
}: {
  quotesEnabled: boolean
  unknownRules: readonly PostgateEmbeddingRule[]
}): PostgateEmbeddingRule[] {
  return quotesEnabled
    ? [...unknownRules]
    : [embeddingRules.disableRule, ...unknownRules]
}
