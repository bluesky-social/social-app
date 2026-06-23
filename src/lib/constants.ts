import {type Insets, Platform} from 'react-native'
import {type AppBskyActorDefs, BSKY_LABELER_DID} from '@atproto/api'

import {type ProxyHeaderValue} from '#/state/session/agent'
import {getActiveBrand} from '#/brand/activeBrand'
import {BLUESKY_PROXY_DID, CHAT_PROXY_DID, IS_DEV} from '#/env'

// Brand is populated by `src/brand/boot.ts` at the entry point, before any
// module that imports `constants.ts` is evaluated. See `src/brand/`.
const brand = getActiveBrand()

export const LOCAL_DEV_SERVICE =
  Platform.OS === 'android' ? 'http://10.0.2.2:2583' : 'http://localhost:2583'
export const STAGING_SERVICE = 'https://staging.bsky.dev'
export const BSKY_SERVICE = brand.pds.serviceUrl
export const BSKY_SERVICE_DID = brand.pds.serviceDid
export const PUBLIC_BSKY_SERVICE = brand.pds.publicService
export const DEFAULT_SERVICE = BSKY_SERVICE
export const HELP_DESK_URL = brand.links.helpDesk
export const EMBED_SERVICE = brand.links.embedService
export const EMBED_SCRIPT = `${EMBED_SERVICE}/static/embed.js`
export const BSKY_DOWNLOAD_URL = brand.links.download
export const STARTER_PACK_MAX_SIZE = 150
export const CARD_ASPECT_RATIO = 1200 / 630

// HACK
// Yes, this is exactly what it looks like. It's a hard-coded constant
// reflecting the number of new users in the last week. We don't have
// time to add a route to the servers for this so we're just going to hard
// code and update this number with each release until we can get the
// server route done.
// -prf
export const JOINED_THIS_WEEK = 560000 // estimate as of 12/18/24

export const DISCOVER_DEBUG_DIDS: Record<string, true> = {
  'did:plc:oisofpd7lj26yvgiivf3lxsi': true, // hailey.at
  'did:plc:p2cp5gopk7mgjegy6wadk3ep': true, // samuel.bsky.team
  'did:plc:ragtjsm2j2vknwkz3zp4oxrd': true, // pfrazee.com
  'did:plc:vpkhqolt662uhesyj6nxm7ys': true, // why.bsky.team
  'did:plc:3jpt2mvvsumj2r7eqk4gzzjz': true, // esb.lol
  'did:plc:vjug55kidv6sye7ykr5faxxn': true, // emilyliu.me
  'did:plc:tgqseeot47ymot4zro244fj3': true, // iwsmith.bsky.social
  'did:plc:2dzyut5lxna5ljiaasgeuffz': true, // darrin.bsky.team
}

export function FEEDBACK_FORM_URL({
  email,
  handle,
}: {
  email?: string
  handle?: string
}): string {
  let str = brand.links.feedbackForm
  // The email/handle prefill query params are specific to the Zendesk request
  // form. Brands with a non-Zendesk feedback destination (e.g. a Google Form)
  // are used as-is.
  if (email && str.includes('zendesk')) {
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

export const MAX_DRAFT_GRAPHEME_LENGTH = 1000

export const MAX_DM_GRAPHEME_LENGTH = 1000

// Recommended is 100 per: https://www.w3.org/WAI/GL/WCAG20/tests/test3.html
// but increasing limit per user feedback
export const MAX_ALT_TEXT = 2000

export const MAX_REPORT_REASON_GRAPHEME_LENGTH = 2000

export function IS_TEST_USER(handle?: string) {
  return handle && handle?.endsWith('.test')
}

export function IS_PROD_SERVICE(url?: string) {
  return url && url !== STAGING_SERVICE && !url.startsWith(LOCAL_DEV_SERVICE)
}

export const PROD_DEFAULT_FEED = (rkey: string) =>
  `at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/${rkey}`

export const STAGING_DEFAULT_FEED = (rkey: string) =>
  `at://did:plc:yofh3kx63drvfljkibw5zuxo/app.bsky.feed.generator/${rkey}`

export const PROD_FEEDS = [
  `feedgen|${PROD_DEFAULT_FEED('whats-hot')}`,
  `feedgen|${PROD_DEFAULT_FEED('thevids')}`,
]

export const STAGING_FEEDS = [
  `feedgen|${STAGING_DEFAULT_FEED('whats-hot')}`,
  `feedgen|${STAGING_DEFAULT_FEED('thevids')}`,
]

export const POST_IMG_MAX = {
  width: 2000,
  height: 2000,
  size: 1000000,
}

export const STAGING_LINK_META_PROXY =
  'https://cardyb.staging.bsky.dev/v1/extract?url='

export const PROD_LINK_META_PROXY = 'https://cardyb.bsky.app/v1/extract?url='

export function LINK_META_PROXY(_serviceUrl: string) {
  if (IS_DEV) {
    return STAGING_LINK_META_PROXY
  }

  return PROD_LINK_META_PROXY
}

export const STATUS_PAGE_URL = brand.links.statusPage

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
export const LANG_DROPDOWN_HITSLOP = {top: 10, bottom: 10, left: 4, right: 4}
export const BACK_HITSLOP = HITSLOP_30
export const MAX_POST_LINES = 25

export const BSKY_APP_ACCOUNT_DID = brand.appAccountDid

export const BSKY_FEED_OWNER_DIDS = [
  BSKY_APP_ACCOUNT_DID,
  'did:plc:vpkhqolt662uhesyj6nxm7ys',
  'did:plc:q6gjnaw2blty4crticxkmujt',
]

export const DISCOVER_FEED_URI =
  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot'
export const VIDEO_FEED_URI =
  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids'
export const STAGING_VIDEO_FEED_URI =
  'at://did:plc:yofh3kx63drvfljkibw5zuxo/app.bsky.feed.generator/thevids'
export const VIDEO_FEED_URIS = [VIDEO_FEED_URI, STAGING_VIDEO_FEED_URI]
// Brand-driven default feed pins. By convention `brand.defaultFeeds[0]` is
// the algorithmic "discover" pin and `[1]` is the following timeline. New
// brands must preserve this ordering — enforced by runtime check in
// `src/brand/boot.ts` and the type assertion below.
export const DISCOVER_SAVED_FEED = brand.defaultFeeds[0]
export const TIMELINE_SAVED_FEED = brand.defaultFeeds[1]
export const VIDEO_SAVED_FEED = {
  type: 'feed',
  value: VIDEO_FEED_URI,
  pinned: true,
}

export const RECOMMENDED_SAVED_FEEDS: Pick<
  AppBskyActorDefs.SavedFeed,
  'type' | 'value' | 'pinned'
>[] = brand.defaultFeeds

export const KNOWN_SHUTDOWN_FEEDS = [
  'at://did:plc:wqowuobffl66jv3kpsvo7ak4/app.bsky.feed.generator/the-algorithm', // for you by skygaze
]

export const GIF_SERVICE = brand.links.gifService

export const GIF_KLIPY_SEARCH = (params: string) =>
  `${GIF_SERVICE}/klipy/v2/search?${params}`
export const GIF_KLIPY_FEATURED = (params: string) =>
  `${GIF_SERVICE}/klipy/v2/featured?${params}`

export const MAX_LABELERS = 20

export const VIDEO_SERVICE = brand.links.videoService
export const VIDEO_SERVICE_DID = brand.links.videoServiceDid

export const VIDEO_MAX_DURATION_MS = 3 * 60 * 1000 // 3 minutes in milliseconds
/**
 * Maximum size of a video in megabytes, _not_ mebibytes. Backend uses
 * ISO megabytes.
 */
export const VIDEO_MAX_SIZE = 1000 * 1000 * 100 // 100mb

export const SUPPORTED_MIME_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/webm',
  'video/quicktime',
  'image/gif',
] as const

export type SupportedMimeTypes = (typeof SUPPORTED_MIME_TYPES)[number]

export const EMOJI_REACTION_LIMIT = 5

export const urls = {
  website: {
    blog: {
      findFriendsAnnouncement: brand.blogUrls.findFriendsAnnouncement,
      initialVerificationAnnouncement:
        brand.blogUrls.initialVerificationAnnouncement,
      searchTipsAndTricks: brand.blogUrls.searchTipsAndTricks,
    },
    support: {
      findFriendsPrivacyPolicy: brand.blogUrls.findFriendsPrivacyPolicy,
    },
  },
}

export const PUBLIC_APPVIEW = brand.pds.appview
export const PUBLIC_APPVIEW_DID = brand.pds.appviewDid
export const PUBLIC_STAGING_APPVIEW_DID = 'did:web:api.staging.bsky.dev'

export const DEV_ENV_APPVIEW = `http://localhost:2584` // always the same
export const DEV_ENV_APPVIEW_DID = `did:plc:dw4kbjf5mn7nhenabiqpkyh3` // always the same

// temp hack for e2e - esb
export const BLUESKY_PROXY_HEADER = {
  value: `${BLUESKY_PROXY_DID}#bsky_appview`,
  get() {
    return this.value as ProxyHeaderValue
  },
  set(value: string) {
    this.value = value
  },
}

export const DM_SERVICE_HEADERS = {
  'atproto-proxy': `${CHAT_PROXY_DID}#bsky_chat`,
}

export const BLUESKY_MOD_SERVICE_HEADERS = {
  'atproto-proxy': `${BSKY_LABELER_DID}#atproto_labeler`,
}

export const BLUESKY_NOTIF_SERVICE_HEADERS = {
  'atproto-proxy': `${BLUESKY_PROXY_DID}#bsky_notif`,
}

export const webLinks = {
  tos: brand.links.tos,
  privacy: brand.links.privacy,
  community: brand.links.community,
  communityDeprecated: brand.links.communityDeprecated,
  copyright: brand.links.copyright,
}
