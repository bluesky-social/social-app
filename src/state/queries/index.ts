import {BskyAgent} from '@atproto/api'

export const PUBLIC_BSKY_AGENT = new BskyAgent({
  service: 'https://api.bsky.app',
})
