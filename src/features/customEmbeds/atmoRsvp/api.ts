import {CDN_SERVICE} from '#/lib/constants'
import {RSVP_STATUS} from '#/features/customEmbeds/atmoRsvp/lexicon'

const ATMO_HOST = 'https://atmo.rsvp'

/**
 * Subset of the `community.lexicon.calendar.event` record we render. The record
 * has more fields; we only type what the card reads.
 */
export type AtmoEventValue = {
  name?: string
  description?: string
  startsAt?: string
  endsAt?: string
  timezone?: string
  /** `community.lexicon.calendar.event#mode` token */
  mode?: string
  /** `community.lexicon.calendar.event#status` token */
  status?: string
  locations?: AtmoLocation[]
}

export type AtmoLocation = {
  $type?: string
  name?: string
  street?: string
  locality?: string
  region?: string
  country?: string
  uri?: string
}

export type AtmoProfile = {
  did: string
  handle?: string
  value?: {
    displayName?: string
    avatar?: {ref?: {$link?: string}}
  }
}

export type AtmoRsvpRecord = {
  uri: string
  cid?: string
  did: string
  value?: {status?: string}
}

export type AtmoEventResponse = {
  uri: string
  cid: string
  did: string
  rkey: string
  value: AtmoEventValue
  rsvpsCount?: number
  rsvpsGoingCount?: number
  rsvps?: Record<string, AtmoRsvpRecord[]>
  profiles?: AtmoProfile[]
}

export type AtmoListRecordsResponse = {
  records: AtmoRsvpRecord[]
  cursor?: string
}

async function atmoXrpc<T>(
  method: string,
  params: Record<string, string | number | boolean>,
  signal?: AbortSignal,
): Promise<T> {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value))
  }
  const res = await fetch(`${ATMO_HOST}/xrpc/${method}?${search.toString()}`, {
    signal,
  })
  const body = (await res.json()) as {error?: string; message?: string}
  if (!res.ok || body.error) {
    throw new Error(body.message || body.error || `atmo.rsvp ${method} failed`)
  }
  return body as unknown as T
}

export async function getAtmoEvent(
  eventUri: string,
  {signal}: {signal?: AbortSignal} = {},
): Promise<AtmoEventResponse> {
  return atmoXrpc<AtmoEventResponse>(
    'rsvp.atmo.event.getRecord',
    {uri: eventUri, hydrateRsvps: 12, profiles: true},
    signal,
  )
}

export async function listViewerRsvps(
  {actor, subjectUri}: {actor: string; subjectUri: string},
  {signal}: {signal?: AbortSignal} = {},
): Promise<AtmoListRecordsResponse> {
  return atmoXrpc<AtmoListRecordsResponse>(
    'rsvp.atmo.rsvp.listRecords',
    {actor, subjectUri},
    signal,
  )
}

/** Builds a CDN image URL for a blob, the same way atmo.rsvp serves them. */
export function bskyCdnImage(
  preset: 'avatar_thumbnail' | 'feed_thumbnail',
  did: string,
  blobCid?: string,
): string | undefined {
  if (!blobCid) return undefined
  return `${CDN_SERVICE}/img/${preset}/plain/${did}/${blobCid}@jpeg`
}

/** Extracts going attendees (with resolved avatar URLs) from an event response. */
export function getGoingAttendees(event: AtmoEventResponse) {
  const going = event.rsvps?.[RSVP_STATUS.going] ?? []
  const profilesByDid = new Map(
    (event.profiles ?? []).map(profile => [profile.did, profile]),
  )
  return going
    .map(rsvp => {
      const profile = profilesByDid.get(rsvp.did)
      if (!profile) return null
      return {
        did: profile.did,
        handle: profile.handle,
        displayName: profile.value?.displayName,
        avatar: bskyCdnImage(
          'avatar_thumbnail',
          profile.did,
          profile.value?.avatar?.ref?.$link,
        ),
      }
    })
    .filter(Boolean) as Array<{
    did: string
    handle?: string
    displayName?: string
    avatar?: string
  }>
}
