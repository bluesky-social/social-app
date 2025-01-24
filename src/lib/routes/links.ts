import {AppBskyGraphDefs, AtUri} from '@atproto/api'

import {isInvalidHandle} from '#/lib/strings/handles'

export function makeProfileLink(
  info: {
    did: string
    handle: string
  },
  ...segments: string[]
) {
  let handleSegment = info.did
  if (info.handle && !isInvalidHandle(info.handle)) {
    handleSegment = info.handle
  }
  return [`/profile`, handleSegment, ...segments].join('/')
}

export function makeCustomFeedLink(
  did: string,
  rkey: string,
  segment?: string | undefined,
  feedCacheKey?: 'discover' | 'explore' | undefined,
) {
  return (
    [`/profile`, did, 'feed', rkey, ...(segment ? [segment] : [])].join('/') +
    (feedCacheKey ? `?feedCacheKey=${encodeURIComponent(feedCacheKey)}` : '')
  )
}

export function makeListLink(did: string, rkey: string, ...segments: string[]) {
  return [`/profile`, did, 'lists', rkey, ...segments].join('/')
}

export function makeTagLink(did: string) {
  return `/search?q=${encodeURIComponent(did)}`
}

export function makeSearchLink(props: {query: string; from?: 'me' | string}) {
  return `/search?q=${encodeURIComponent(
    props.query + (props.from ? ` from:${props.from}` : ''),
  )}`
}

export function makeStarterPackLink(
  starterPackOrName:
    | AppBskyGraphDefs.StarterPackViewBasic
    | AppBskyGraphDefs.StarterPackView
    | string,
  rkey?: string,
) {
  if (typeof starterPackOrName === 'string') {
    return `https://bsky.app/start/${starterPackOrName}/${rkey}`
  } else {
    const uriRkey = new AtUri(starterPackOrName.uri).rkey
    return `https://bsky.app/start/${starterPackOrName.creator.handle}/${uriRkey}`
  }
}
