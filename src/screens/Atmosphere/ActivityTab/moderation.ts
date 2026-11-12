import {
  mergeModUIResults,
  moderateProfile,
  ModerationDecision,
  type ModerationOpts,
  type ModerationUI,
} from '@bsky/sdk/moderation'

import {moderateExternalView} from '#/lib/moderation/moderateExternalView'
import type * as bsky from '#/types/bsky'
import {type ActivityContent} from './rows'

/**
 * Moderation for one activity card: its content (and the content's owner),
 * an article's publisher, and the actor who did the activity, when known.
 */
export function moderateActivity(
  content: ActivityContent,
  actor: bsky.profile.AnyProfileView | undefined,
  opts: ModerationOpts,
): ModerationUI {
  const decision = ModerationDecision.merge(
    moderateExternalView(content.view, opts),
    content.type === 'article' && content.view.publisher
      ? moderateExternalView(content.view.publisher, opts)
      : undefined,
    actor ? moderateProfile(actor, opts) : undefined,
  )
  return mergeModUIResults(
    decision.ui('contentList'),
    decision.ui('contentMedia'),
  )
}

/**
 * Cards we drop before rendering: filtered from lists (mutes, muted words,
 * labels set to hide), or blurred with no way for the user to reveal them.
 * Blurs the user can click through still render.
 */
export function isActivityHidden(moderation: ModerationUI): boolean {
  return moderation.filter || (moderation.blur && moderation.noOverride)
}

/**
 * Actors we leave out of a card's supporting cast, such as the avatars in a
 * related-activity pill. They still count toward "+N".
 */
export function isActorHidden(
  actor: bsky.profile.AnyProfileView,
  opts: ModerationOpts,
): boolean {
  return isActivityHidden(moderateProfile(actor, opts).ui('profileList'))
}
