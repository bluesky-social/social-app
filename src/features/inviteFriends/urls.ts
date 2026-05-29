/**
 * URL helpers for the Invite Friends share sheet (APP-2142).
 *
 * We display a cosmetic `bsky.app/invite/{shortHandle}` string to match the
 * design, but every actual action (QR payload, share sheet, clipboard) uses
 * the canonical `https://bsky.app/profile/{handle}` URL because no
 * `bsky.app/invite/...` route exists yet.
 */

function stripLeadingAt(handle: string): string {
  return handle.startsWith('@') ? handle.slice(1) : handle
}

/** Canonical URL - used for QR payload, Share, and Copy. Empty handle -> empty string. */
export function getInviteShareUrl(handle: string): string {
  const bare = stripLeadingAt(handle).toLowerCase()
  if (!bare) return ''
  return `https://bsky.app/profile/${bare}`
}

/** Cosmetic label shown in the "Invite link" field. Not a functional URL. */
export function getInviteDisplayUrl(handle: string): string {
  const bare = stripLeadingAt(handle)
  if (!bare) return ''
  const short = bare.split('.')[0].toLowerCase()
  if (!short) return ''
  return `bsky.app/invite/${short}`
}
