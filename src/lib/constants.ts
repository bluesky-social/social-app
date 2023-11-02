import {Insets} from 'react-native'

const HELP_DESK_LANG = 'en-us'
export const HELP_DESK_URL = `https://blueskyweb.zendesk.com/hc/${HELP_DESK_LANG}`

const BASE_FEEDBACK_FORM_URL = `${HELP_DESK_URL}/requests/new`
export function FEEDBACK_FORM_URL({
  email,
  handle,
}: {
  email?: string
  handle?: string
}): string {
  let str = BASE_FEEDBACK_FORM_URL
  if (email) {
    str += `?tf_anonymous_requester_email=${encodeURIComponent(email)}`
    if (handle) {
      str += `&tf_17205412673421=${encodeURIComponent(handle)}`
    }
  }
  return str
}

export const MAX_DISPLAY_NAME = 64
export const MAX_DESCRIPTION = 256

export const MAX_GRAPHEME_LENGTH = 300

// Recommended is 100 per: https://www.w3.org/WAI/GL/WCAG20/tests/test3.html
// but increasing limit per user feedback
export const MAX_ALT_TEXT = 1000

export function IS_LOCAL_DEV(url: string) {
  return url.includes('localhost')
}

export function IS_STAGING(url: string) {
  return !IS_LOCAL_DEV(url) && !IS_PROD(url)
}

export function IS_PROD(url: string) {
  // NOTE
  // until open federation, "production" is defined as the main server
  // this definition will not work once federation is enabled!
  // -prf
  return url.startsWith('https://bsky.social')
}

export const PROD_TEAM_HANDLES = [
  'jay.bsky.social',
  'pfrazee.com',
  'divy.zone',
  'dholms.xyz',
  'why.bsky.world',
  'iamrosewang.bsky.social',
]
export const STAGING_TEAM_HANDLES = [
  'arcalinea.staging.bsky.dev',
  'paul.staging.bsky.dev',
  'paul2.staging.bsky.dev',
]
export const DEV_TEAM_HANDLES = ['alice.test', 'bob.test', 'carla.test']

export function TEAM_HANDLES(serviceUrl: string) {
  if (serviceUrl.includes('localhost')) {
    return DEV_TEAM_HANDLES
  } else if (serviceUrl.includes('staging')) {
    return STAGING_TEAM_HANDLES
  } else {
    return PROD_TEAM_HANDLES
  }
}

export const STAGING_DEFAULT_FEED = (rkey: string) =>
  `at://did:plc:wqzurwm3kmaig6e6hnc2gqwo/app.bsky.feed.generator/${rkey}`
export const PROD_DEFAULT_FEED = (rkey: string) =>
  `at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/${rkey}`
export async function DEFAULT_FEEDS(
  serviceUrl: string,
  resolveHandle: (name: string) => Promise<string>,
) {
  // TODO: remove this when the test suite no longer relies on it
  if (IS_LOCAL_DEV(serviceUrl)) {
    // local dev
    const aliceDid = await resolveHandle('alice.test')
    return {
      pinned: [
        `at://${aliceDid}/app.bsky.feed.generator/alice-favs`,
        `at://${aliceDid}/app.bsky.feed.generator/alice-favs2`,
      ],
      saved: [
        `at://${aliceDid}/app.bsky.feed.generator/alice-favs`,
        `at://${aliceDid}/app.bsky.feed.generator/alice-favs2`,
      ],
    }
  } else if (IS_STAGING(serviceUrl)) {
    // staging
    return {
      pinned: [STAGING_DEFAULT_FEED('whats-hot')],
      saved: [
        STAGING_DEFAULT_FEED('bsky-team'),
        STAGING_DEFAULT_FEED('with-friends'),
        STAGING_DEFAULT_FEED('whats-hot'),
        STAGING_DEFAULT_FEED('hot-classic'),
      ],
    }
  } else {
    // production
    return {
      pinned: [PROD_DEFAULT_FEED('whats-hot')],
      saved: [PROD_DEFAULT_FEED('whats-hot')],
    }
  }
}

export const POST_IMG_MAX = {
  width: 2000,
  height: 2000,
  size: 1000000,
}

export const STAGING_LINK_META_PROXY =
  'https://cardyb.staging.bsky.dev/v1/extract?url='

export const PROD_LINK_META_PROXY = 'https://cardyb.bsky.app/v1/extract?url='

export function LINK_META_PROXY(serviceUrl: string) {
  if (IS_LOCAL_DEV(serviceUrl)) {
    return STAGING_LINK_META_PROXY
  } else if (IS_STAGING(serviceUrl)) {
    return STAGING_LINK_META_PROXY
  } else {
    return PROD_LINK_META_PROXY
  }
}

export const STATUS_PAGE_URL = 'https://status.bsky.app/'

// Hitslop constants
export const createHitslop = (size: number): Insets => ({
  top: size,
  left: size,
  bottom: size,
  right: size,
})
export const HITSLOP_10 = createHitslop(10)
export const HITSLOP_20 = createHitslop(20)
export const HITSLOP_30 = createHitslop(30)
export const BACK_HITSLOP = HITSLOP_30
export const MAX_POST_LINES = 25
