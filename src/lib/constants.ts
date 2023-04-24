export const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdavFRXTdB6tRobaFrRR2A1gv3b-IBHwQkBmNZTRpoqmcrPrQ/viewform?usp=sf_link'

export const MAX_DISPLAY_NAME = 64
export const MAX_DESCRIPTION = 256

// Recommended is 100 per: https://www.w3.org/WAI/GL/WCAG20/tests/test3.html
// but increasing limit per user feedback
export const MAX_ALT_TEXT = 1000

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

export const PROD_SUGGESTED_FOLLOWS = [
  'faithlove.art',
  'danielkoeth.bsky.social',
  'bsky.app',
  'jay.bsky.team',
  'pfrazee.com',
  'why.bsky.team',
  'support.bsky.team',
  'jack.bsky.social',
  'earthquake.bsky.social',
  'jamesgunn.bsky.social',
  'seangunn.bsky.social',
  'kumail.bsky.social',
  'craignewmark.bsky.social',
  'grimes.bsky.social',
  'xychelsea.tv',
  'mcq.bsky.social',
  'mmasnick.bsky.social',
  'nitasha.bsky.social',
  'kenklippenstein.bsky.social',
  'jaypeters.bsky.social',
  'miyagawa.bsky.social',
  'anildash.com',
  'tiffani.bsky.social',
  'kelseyhightower.com',
  'aliafonzy.bsky.social',
  'tszzl.bsky.social',
  'danabramov.bsky.social',
  'shinyakato.dev',
  'karpathy.bsky.social',
  'lookitup.baby',
  'brooke.vibe.camp',
  'mollywhite.net',
  'amir.blue',
  'zoink.bsky.social',
  'moskov.bsky.social',
]
export const STAGING_SUGGESTED_FOLLOWS = ['arcalinea', 'paul', 'paul2'].map(
  handle => `${handle}.staging.bsky.dev`,
)
export const DEV_SUGGESTED_FOLLOWS = ['alice', 'bob', 'carla'].map(
  handle => `${handle}.test`,
)
export function SUGGESTED_FOLLOWS(serviceUrl: string) {
  if (serviceUrl.includes('localhost')) {
    return DEV_SUGGESTED_FOLLOWS
  } else if (serviceUrl.includes('staging')) {
    return STAGING_SUGGESTED_FOLLOWS
  } else {
    return PROD_SUGGESTED_FOLLOWS
  }
}

export const POST_IMG_MAX = {
  width: 2000,
  height: 2000,
  size: 1000000,
}
