import {isValidAtUri} from '@atproto/syntax'

import {type AtmosphereTab} from '#/screens/Atmosphere/metrics/types'

/**
 * The most URIs an activity list link carries. Like the notifications activity
 * list, this keeps web paths under the 16 KiB limit of the load balancer in
 * front of bsky.app.
 */
export const MAX_ACTIVITY_LIST_URIS = 150

/** Link to the activity list screen, which shows the given records as cards. */
export function makeActivityListLink(uris: string[]) {
  return `/atmosphere/activity?uris=${encodeURIComponent(toList(uris))}`
}

function toList(uris: string[]) {
  return uris.slice(0, MAX_ACTIVITY_LIST_URIS).join(',')
}

/*
 * The tab the activity list was last opened from, for its metrics. Kept out
 * of the link, so it doesn't show in the URL, and matched on the URIs, so a
 * list opened some other way, e.g. from a shared link, reports no tab.
 */
let origin: {list: string; tab: AtmosphereTab | undefined} | undefined

/** Call just before opening an activity list from a tab. */
export function setActivityListOrigin(
  uris: string[],
  tab: AtmosphereTab | undefined,
) {
  origin = {list: toList(uris), tab}
}

/** The tab an activity list was opened from, if known. Call once per list. */
export function takeActivityListOrigin(uris: string[]) {
  const {list, tab} = origin ?? {}
  origin = undefined
  return list === toList(uris) ? tab : undefined
}

/** The URIs from an activity list link, dropping any that aren't valid. */
export function parseActivityListUris(uris: string) {
  return decodeURIComponent(uris).split(',').filter(isValidAtUri)
}
