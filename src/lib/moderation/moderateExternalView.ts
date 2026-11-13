import {
  moderateExternalView as moderateExternalViewSdk,
  type ModerationDecision,
  type ModerationOpts,
  type ModerationSubjectExternalView,
} from '@bsky/sdk/moderation'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/**
 * The SDK's external-view moderation (labels, plus the owner's account,
 * profile, and viewer state), with muted words checked against the text this
 * app renders. Nested views, such as an article's publisher, need their own
 * decision.
 */
export function moderateExternalView(
  view: ModerationSubjectExternalView,
  opts: ModerationOpts,
): ModerationDecision {
  return moderateExternalViewSdk(view, opts, {
    texts: opts.prefs.mutedWords.length ? getRenderedTexts(view) : [],
  })
}

/** The title and description, and any gallery image alt text. */
function getRenderedTexts(view: ModerationSubjectExternalView): string[] {
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
  return texts
}
