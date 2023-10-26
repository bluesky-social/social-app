import {isInvalidHandle} from 'lib/strings/handles'

export function makeProfileLink(
  info: {
    did: string
    handle: string
  },
  ...segments: string[]
) {
  return [
    `/profile`,
    `${isInvalidHandle(info.handle) ? info.did : info.handle}`,
    ...segments,
  ].join('/')
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
