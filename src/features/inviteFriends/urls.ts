/**
 * URL helpers for the Invite Friends share sheet (APP-2142).
 *
 * Every action (QR payload, share sheet, clipboard) and the displayed label
 * all derive from the same canonical `{BSKY_APP_HOST}/profile/{handle}` URL
 * (BSKY_APP_HOST resolves to the Blacksky brand host, e.g.
 * `https://blacksky.community`), so what the user reads matches exactly what
 * they copy/share. The displayed label simply drops the `https://` scheme for
 * readability.
 */

import {BSKY_APP_HOST} from '#/lib/strings/url-helpers'

function stripLeadingAt(handle: string): string {
  return handle.startsWith('@') ? handle.slice(1) : handle
}

/** Canonical URL - used for QR payload, Share, and Copy. Empty handle -> empty string. */
export function getInviteShareUrl(handle: string): string {
  const bare = stripLeadingAt(handle)
  if (!bare) return ''
  return `${BSKY_APP_HOST.replace(/\/$/, '')}/profile/${bare}`
}

/**
 * Human-readable label shown in the "Invite link" field. This is the same
 * canonical URL as getInviteShareUrl with the `https://` scheme stripped, so
 * the displayed text always resolves and matches what Copy/Share use.
 */
export function getInviteDisplayUrl(handle: string): string {
  return getInviteShareUrl(handle).replace(/^https:\/\//, '')
}
