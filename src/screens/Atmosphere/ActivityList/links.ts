import {isValidAtUri} from '@atproto/syntax'

/**
 * The most URIs an activity list link carries. Like the notifications activity
 * list, this keeps web paths under the 16 KiB limit of the load balancer in
 * front of bsky.app.
 */
export const MAX_ACTIVITY_LIST_URIS = 150

/** Link to the activity list screen, which shows the given records as cards. */
export function makeActivityListLink(uris: string[]) {
  const list = uris.slice(0, MAX_ACTIVITY_LIST_URIS).join(',')
  return `/atmosphere/activity?uris=${encodeURIComponent(list)}`
}

/** The URIs from an activity list link, dropping any that aren't valid. */
export function parseActivityListUris(uris: string) {
  return decodeURIComponent(uris).split(',').filter(isValidAtUri)
}
