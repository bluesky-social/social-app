import {AtUri} from '@atproto/syntax'

export function getRkey({uri}: {uri: string}): string {
  const at = new AtUri(uri)
  return at.rkey
}
