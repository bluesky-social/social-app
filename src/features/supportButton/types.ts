/**
 * The only verb shipping in v1. Kept as a union so later verbs (Subscribe,
 * Buy, ...) slot in without reshaping stored data.
 */
export type SupportVerb = 'support'

/**
 * A payment destination a creator has attached to their profile. Bluesky never
 * touches the money - this is just a pointer to where it happens.
 */
export type SupportLink = {
  uri: string
  verb: SupportVerb
  createdAt: string
}

export type SupportProvider = {
  /** Stable id used for matching and display. */
  id: string
  /** Human name, e.g. "Ko-fi". */
  name: string
  /** Apex hosts that identify this provider. Subdomains match too. */
  hosts: string[]
}
