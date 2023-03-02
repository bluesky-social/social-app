export const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdavFRXTdB6tRobaFrRR2A1gv3b-IBHwQkBmNZTRpoqmcrPrQ/viewform?usp=sf_link'

export const MAX_DISPLAY_NAME = 64
export const MAX_DESCRIPTION = 256

export const PROD_TEAM_HANDLES = [
  'jay.bsky.social',
  'paul.bsky.social',
  'dan.bsky.social',
  'divy.bsky.social',
  'why.bsky.social',
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
  'john',
  'visakanv',
  'saz',
  'steph',
  'ratzlaff',
  'beth',
  'weisser',
  'katherine',
  'annagat',
  'josh',
  'lurkshark',
  'amir',
  'amyxzh',
  'danielle',
  'jack-frazee',
  'vibes',
  'cat',
  'yuriy',
  'alvinreyes',
  'skoot',
  'patricia',
  'ara4n',
  'case',
  'armand',
  'ivan',
  'nicholas',
  'kelsey',
  'ericlee',
  'emily',
  'jake',
  'jennijuju',
  'ian5v',
  'bnewbold',
  'chris',
  'mtclai',
  'willscott',
  'michael',
  'kwkroeger',
  'broox',
  'iamrosewang',
  'jack-morrison',
  'pwang',
  'martin',
  'jack',
  'dan',
  'why',
  'divy',
  'jay',
  'paul',
].map(handle => `${handle}.bsky.social`)
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

export const POST_IMG_MAX_WIDTH = 2000
export const POST_IMG_MAX_HEIGHT = 2000
export const POST_IMG_MAX_SIZE = 1000000

export const DESKTOP_HEADER_HEIGHT = 57
