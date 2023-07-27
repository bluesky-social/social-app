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
