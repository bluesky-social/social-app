import {isInvalidHandle} from 'lib/strings/handles'

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
  ...segments: string[]
) {
  return [`/profile`, did, 'feed', rkey, ...segments].join('/')
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
