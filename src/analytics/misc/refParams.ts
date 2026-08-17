/**
 * This is used for our own Bluesky post embeds, and maybe other things.
 *
 * In the case of our embeds, `ref_src=embed`. Not sure if `ref_url` is used.
 */

import * as env from '#/env'

const FBCLID_STORAGE_KEY = 'bsky.analytics.fbclid'
const FBCLID_TTL = 7 * 24 * 60 * 60 * 1000

type FbclidAttribution = {
  fbclid: string
  timestamp: number
}

function getStoredFbclid(now: number): FbclidAttribution | undefined {
  const value = window.localStorage.getItem(FBCLID_STORAGE_KEY)
  if (!value) return

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    window.localStorage.removeItem(FBCLID_STORAGE_KEY)
    return
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('fbclid' in parsed) ||
    typeof parsed.fbclid !== 'string' ||
    !parsed.fbclid ||
    !('timestamp' in parsed) ||
    typeof parsed.timestamp !== 'number' ||
    !Number.isFinite(parsed.timestamp) ||
    parsed.timestamp <= 0 ||
    now - parsed.timestamp >= FBCLID_TTL
  ) {
    window.localStorage.removeItem(FBCLID_STORAGE_KEY)
    return
  }

  return {fbclid: parsed.fbclid, timestamp: parsed.timestamp}
}

let refSrc = ''
let refUrl = ''
let fbclid = ''
let fbclidTimestamp = 0
if (env.IS_WEB) {
  const params = new URLSearchParams(window.location.search)
  refSrc = params.get('ref_src') ?? ''
  refUrl = decodeURIComponent(params.get('ref_url') ?? '')

  const queryFbclid = params.get('fbclid') ?? ''
  const now = Date.now()

  try {
    const stored = getStoredFbclid(now)
    const attribution = queryFbclid
      ? stored?.fbclid === queryFbclid
        ? stored
        : {fbclid: queryFbclid, timestamp: now}
      : stored

    if (attribution) {
      fbclid = attribution.fbclid
      fbclidTimestamp = attribution.timestamp

      if (queryFbclid && stored?.fbclid !== queryFbclid) {
        window.localStorage.setItem(
          FBCLID_STORAGE_KEY,
          JSON.stringify(attribution),
        )
      }
    }
  } catch {
    // localStorage may be unavailable, notably in private browsing. The click
    // from the current URL can still be attributed for this page load.
    if (queryFbclid) {
      fbclid = queryFbclid
      fbclidTimestamp = now
    }
  }
}

export const src = refSrc
export const url = refUrl
export {fbclid, fbclidTimestamp}
