import type tldts from 'tldts'

const COMMON_ERROR_PATTERN =
  /([a-zA-Z0-9._%+-]+)@(gnail\.(co|com)|gmaill\.(co|com)|gmai\.(co|com)|gmail\.co|gmal\.(co|com)|iclod\.(co|com)|icloud\.co|outllok\.(co|com)|outlok\.(co|com)|outlook\.co|yaoo\.(co|com)|yaho\.(co|com)|yahoo\.co|yahooo\.(co|com))$/

export function isEmailMaybeInvalid(email: string, dynamicTldts: typeof tldts) {
  const isIcann = dynamicTldts.parse(email).isIcann
  return !isIcann || COMMON_ERROR_PATTERN.test(email)
}
