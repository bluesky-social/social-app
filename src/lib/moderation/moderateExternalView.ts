import {
  matchMuteWords,
  moderateExternalView as moderateExternalViewLabels,
  moderateProfile,
  ModerationDecision,
  type ModerationOpts,
  type ModerationSubjectExternalView,
} from '@bsky/sdk/moderation'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/**
 * Adds owner moderation and muted words to the SDK's external-view labels.
 * Nested views, such as an article's publisher, need their own decision.
 */
export function moderateExternalView(
  view: ModerationSubjectExternalView,
  opts: ModerationOpts,
): ModerationDecision {
  const contentModeration = moderateExternalViewLabels(view, opts)
  /* The SDK derives ownership from the first backing record's DID. */
  const owner = view.associatedProfiles?.find(
    profile => profile.did === contentModeration.did,
  )
  const moderation = ModerationDecision.merge(
    contentModeration,
    owner ? moderateProfile(owner, opts) : undefined,
  )

  if (!moderation.isMe && opts.prefs.mutedWords.length) {
    const texts = [`${view.title} ${view.description}`]
    if ('items' in view) {
      for (const item of view.items) {
        if (
          bsky.isType(app.bsky.embed.external.viewGalleryImage, item) &&
          bsky.matches(app.bsky.embed.external.viewGalleryImage, item) &&
          item.alt
        ) {
          texts.push(item.alt)
        }
      }
    }
    for (const text of texts) {
      const matches = matchMuteWords({
        mutedWords: opts.prefs.mutedWords,
        text,
        actor: owner,
      })
      if (matches) {
        moderation.addMutedWord(matches)
        break
      }
    }
  }

  return moderation
}
