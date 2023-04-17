export const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdavFRXTdB6tRobaFrRR2A1gv3b-IBHwQkBmNZTRpoqmcrPrQ/viewform?usp=sf_link'

export const MAX_DISPLAY_NAME = 64
export const MAX_DESCRIPTION = 256

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
  'christina',
  'wesam',
  'jim',
  'ab',
  'karalabe',
  'clun',
  'staltz',
  'gillian',
  'karpathy',
  'zoink',
  'john',
  'round',
  'vex',
  'umang',
  'atroyn',
  'poisonivy',
  'wongmjane',
  'lari',
  'arunwadhwa',
  'trav',
  'fred',
  'offscript',
  'satnam',
  'ella',
  'caspian',
  'spencer',
  'nickgrossman',
  'koji',
  'avy',
  'seymourstein',
  'joelg',
  'stig',
  'rabble',
  'hunterwalk',
  'evan',
  'aviral',
  'tami',
  'generativist',
  'gord',
  'ninjapleasedj',
  'robotics',
  'noahjnelson',
  'vijay',
  'scottbeale',
  'daybreakjung',
  'shelby',
  'joel',
  'space',
  'rish',
  'simon',
  'kelly',
  'maxbittker',
  'sylphrenetic',
  'caleb',
  'jik',
  'james',
  'neil',
  'tippenein',
  'mandel',
  'sharding',
  'tyler',
  'raymond',
  'visakanv',
  'saz',
  'steph',
  'ratzlaff',
  'beth',
  'weisser',
  'katherine',
  'annagat',
  'an',
  'kunal',
  'josh',
  'lurkshark',
  'amir',
  'amyxzh',
  'danielle',
  'jack-frazee',
  'daniellefong',
  'dystopiabreaker',
  'morgan',
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
  'jasmine',
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
  'jay',
]
  .map(handle => `${handle}.bsky.social`)
  .concat(['pfrazee.com', 'divy.zone', 'dholms.xyz', 'why.bsky.world'])
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
