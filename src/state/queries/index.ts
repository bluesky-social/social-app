import {BskyAgent} from '@atproto/api'

import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'

export const PUBLIC_BSKY_AGENT = new BskyAgent({
  service: PUBLIC_BSKY_SERVICE,
})

export const STALE = {
  SECONDS: {
    FIFTEEN: 1e3 * 15,
    THIRTY: 1e3 * 30,
  },
  MINUTES: {
    ONE: 1e3 * 60,
    FIVE: 1e3 * 60 * 5,
  },
  HOURS: {
    ONE: 1e3 * 60 * 60,
  },
  INFINITY: Infinity,
}
