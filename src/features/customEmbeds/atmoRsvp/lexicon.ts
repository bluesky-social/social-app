/**
 * Constants for the community calendar lexicons used by atmo.rsvp.
 * See https://github.com/lexicon-community/lexicon (community.lexicon.calendar.*)
 */

export const EVENT_COLLECTION = 'community.lexicon.calendar.event'
export const RSVP_COLLECTION = 'community.lexicon.calendar.rsvp'

export const RSVP_STATUS = {
  going: 'community.lexicon.calendar.rsvp#going',
  interested: 'community.lexicon.calendar.rsvp#interested',
  notgoing: 'community.lexicon.calendar.rsvp#notgoing',
} as const

export type RsvpStatus = keyof typeof RSVP_STATUS

export const EVENT_MODE = {
  inperson: 'community.lexicon.calendar.event#inperson',
  virtual: 'community.lexicon.calendar.event#virtual',
  hybrid: 'community.lexicon.calendar.event#hybrid',
} as const

export const EVENT_STATUS_CANCELLED =
  'community.lexicon.calendar.event#cancelled'

/** Maps a full status token back to its short key, e.g. `#going` -> `going`. */
export function rsvpStatusFromToken(token?: string): RsvpStatus | null {
  if (!token) return null
  for (const key of Object.keys(RSVP_STATUS) as RsvpStatus[]) {
    if (RSVP_STATUS[key] === token) return key
  }
  return null
}
