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

// NOTE
// this is a temporary list that we periodically update
// it is used in the search interface if the user doesn't follow anybody
// -prf
export const PROD_SUGGESTED_FOLLOWS = [
  'bsky.app',
  'jay.bsky.team',
  'pfrazee.com',
  'why.bsky.team',
  'dholms.xyz',
  'emily.bsky.team',
  'rose.bsky.team',
  'jack.bsky.social',
  'faithlove.art',
  'annaghughes.bsky.social',
  'astrokatie.com',
  'whysharksmatter.bsky.social',
  'jamesgunn.bsky.social',
  'seangunn.bsky.social',
  'kumail.bsky.social',
  'craignewmark.bsky.social',
  'xychelsea.tv',
  'catsofyore.bsky.social',
  'mcq.bsky.social',
  'mmasnick.bsky.social',
  'kelseyhightower.com',
  'aliafonzy.bsky.social',
  'bradfitz.com',
  'danabramov.bsky.social',
  'shinyakato.dev',
  'karpathy.bsky.social',
  'lookitup.baby',
  'pariss.blacktechpipeline.com',
  'swiftonsecurity.com',
  'ericajoy.astrel.la',
  'b0rk.jvns.ca',
  'vickiboykis.com',
  'brooke.vibe.camp',
  'amir.blue',
  'moskov.bsky.social',
  'neilhimself.bsky.social',
  'kylierobison.com',
  'carnage4life.bsky.social',
  'lolennui.bsky.social',
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
