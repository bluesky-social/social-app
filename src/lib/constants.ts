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
  if (IS_LOCAL_DEV(serviceUrl)) {
    // local dev
    const aliceDid = await resolveHandle('alice.test')
    return {
      pinned: [`at://${aliceDid}/app.bsky.feed.generator/alice-favs`],
      saved: [`at://${aliceDid}/app.bsky.feed.generator/alice-favs`],
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
      pinned: [
        PROD_DEFAULT_FEED('whats-hot'),
        PROD_DEFAULT_FEED('with-friends'),
      ],
      saved: [
        PROD_DEFAULT_FEED('bsky-team'),
        PROD_DEFAULT_FEED('with-friends'),
        PROD_DEFAULT_FEED('whats-hot'),
        PROD_DEFAULT_FEED('hot-classic'),
      ],
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

export const RECOMMENDED_FEEDS = [
  {
    did: 'did:plc:hsqwcidfez66lwm3gxhfv5in',
    rkey: 'aaaf2pqeodmpy',
  },
  {
    did: 'did:plc:gekdk2nd47gkk3utfz2xf7cn',
    rkey: 'aaap4tbjcfe5y',
  },
  {
    did: 'did:plc:5rw2on4i56btlcajojaxwcat',
    rkey: 'aaao6g552b33o',
  },
  {
    did: 'did:plc:jfhpnnst6flqway4eaeqzj2a',
    rkey: 'for-science',
  },
  {
    did: 'did:plc:7q4nnnxawajbfaq7to5dpbsy',
    rkey: 'bsky-news',
  },
  {
    did: 'did:plc:jcoy7v3a2t4rcfdh6i4kza25',
    rkey: 'astro',
  },
  {
    did: 'did:plc:tenurhgjptubkk5zf5qhi3og',
    rkey: 'h-nba',
  },
  {
    did: 'did:plc:vpkhqolt662uhesyj6nxm7ys',
    rkey: 'devfeed',
  },
  {
    did: 'did:plc:cndfx4udwgvpjaakvxvh7wm5',
    rkey: 'flipboard-tech',
  },
  {
    did: 'did:plc:w4xbfzo7kqfes5zb7r6qv3rw',
    rkey: 'blacksky',
  },
  {
    did: 'did:plc:lptjvw6ut224kwrj7ub3sqbe',
    rkey: 'aaaotfjzjplna',
  },
  {
    did: 'did:plc:gkvpokm7ec5j5yxls6xk4e3z',
    rkey: 'formula-one',
  },
  {
    did: 'did:plc:q6gjnaw2blty4crticxkmujt',
    rkey: 'positivifeed',
  },
  {
    did: 'did:plc:l72uci4styb4jucsgcrrj5ap',
    rkey: 'aaao5dzfm36u4',
  },
  {
    did: 'did:plc:k3jkadxv5kkjgs6boyon7m6n',
    rkey: 'aaaavlyvqzst2',
  },
  {
    did: 'did:plc:nkahctfdi6bxk72umytfwghw',
    rkey: 'aaado2uvfsc6w',
  },
  {
    did: 'did:plc:epihigio3d7un7u3gpqiy5gv',
    rkey: 'aaaekwsc7zsvs',
  },
  {
    did: 'did:plc:qiknc4t5rq7yngvz7g4aezq7',
    rkey: 'aaaejxlobe474',
  },
  {
    did: 'did:plc:mlq4aycufcuolr7ax6sezpc4',
    rkey: 'aaaoudweck6uy',
  },
  {
    did: 'did:plc:rcez5hcvq3vzlu5x7xrjyccg',
    rkey: 'aaadzjxbcddzi',
  },
  {
    did: 'did:plc:lnxbuzaenlwjrncx6sc4cfdr',
    rkey: 'aaab2vesjtszc',
  },
  {
    did: 'did:plc:x3cya3wkt4n6u4ihmvpsc5if',
    rkey: 'aaacynbxwimok',
  },
  {
    did: 'did:plc:abv47bjgzjgoh3yrygwoi36x',
    rkey: 'aaagt6amuur5e',
  },
  {
    did: 'did:plc:ffkgesg3jsv2j7aagkzrtcvt',
    rkey: 'aaacjerk7gwek',
  },
  {
    did: 'did:plc:geoqe3qls5mwezckxxsewys2',
    rkey: 'aaai43yetqshu',
  },
  {
    did: 'did:plc:2wqomm3tjqbgktbrfwgvrw34',
    rkey: 'authors',
  },
]
