/**
 * URL helpers for the Invite Friends share sheet (APP-2142).
 *
 * Every action (QR payload, share sheet, clipboard) and the displayed label
 * all derive from the same canonical `https://{host}/profile/{handle}` URL,
 * where `{host}` is the brand's primary web host (BRAND.web.hosts[0]), so what
 * the user reads matches exactly what they copy/share. The displayed label
 * simply drops the `https://` scheme for readability.
 *
 * BRAND is an import-free config leaf, so this module stays light (no
 * #/lib/strings/url-helpers / @atproto/api graph) and its unit tests stay fast.
 */

import {BRAND} from '#/config/brand'

function stripLeadingAt(handle: string): string {
  return handle.startsWith('@') ? handle.slice(1) : handle
}

/** Canonical URL - used for QR payload, Share, and Copy. Empty handle -> empty string. */
export function getInviteShareUrl(handle: string): string {
  const bare = stripLeadingAt(handle)
  if (!bare) return ''
  return `https://${BRAND.web.hosts[0]}/profile/${bare}`
}

/**
 * Human-readable label shown in the "Invite link" field. This is the same
 * canonical URL as getInviteShareUrl with the `https://` scheme stripped, so
 * the displayed text always resolves and matches what Copy/Share use.
 */
export function getInviteDisplayUrl(handle: string): string {
  return getInviteShareUrl(handle).replace(/^https:\/\//, '')
}
