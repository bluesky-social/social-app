/**
 * atmo.rsvp event links look like:
 *   https://atmo.rsvp/p/{handle}/e/{rkey}
 * where {handle} is the event owner (handle or DID) and {rkey} is the rkey of
 * their `community.lexicon.calendar.event` record.
 */
const ATMO_RSVP_EVENT_RE = /^https?:\/\/atmo\.rsvp\/p\/([^/]+)\/e\/([^/?#]+)/i

export type AtmoRsvpEventRef = {
  /** Handle or DID of the event owner, taken verbatim from the URL. */
  actor: string
  rkey: string
}

export function parseAtmoRsvpEvent(url: string): AtmoRsvpEventRef | null {
  const match = ATMO_RSVP_EVENT_RE.exec(url)
  if (!match) return null
  const [, actor, rkey] = match
  if (!actor || !rkey) return null
  return {actor: decodeURIComponent(actor), rkey}
}

export function isAtmoRsvpEventUrl(url: string): boolean {
  return parseAtmoRsvpEvent(url) !== null
}
