import {isBskyPostUrl} from '#/lib/strings/url-helpers'

/**
 * Which slot on a post a given URI is destined for. Bluesky post URLs go to
 * the `quote` slot; everything else (feed/list/starter-pack records and
 * generic external links) goes to the `embed` slot.
 *
 * Used by addUri to set the pending state on the correct slot synchronously,
 * surface conflict no-ops upfront, and avoid a "data moves between slots"
 * race after async resolution.
 */
export type EmbedTargetSlot = 'quote' | 'embed'

export function classifyUriTarget(uri: string): EmbedTargetSlot {
  if (isBskyPostUrl(uri)) return 'quote'
  return 'embed'
}
