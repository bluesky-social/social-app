const base = 'https://waverly.social/profile'
const subPath = 'w'

export interface MiniblogUriInfo {
  handle: string
  rkey: string
}

export function makeMiniblogUri(handle: string, rkey: string) {
  return `${base}/${handle}/${subPath}/${rkey}`
}

const regExp = `${base}/([a-zA-Z0-9\\-._~]+)/${subPath}/([a-zA-Z0-9\\-._~]+)`

export function extractMiniblogUriInfo(miniblogUri?: string) {
  if (miniblogUri === undefined) return undefined
  const regex = new RegExp(`^${regExp}$`)
  const match = miniblogUri.match(regex)

  if (match) {
    const [, handle, rkey] = match
    return {handle, rkey}
  }

  return undefined
}

export function findMiniblogUriInText(text?: string) {
  if (text === undefined) return undefined
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${regExp}($|\\s)`)
  const match = text.match(regex)

  if (match) {
    const [, , handle, rkey] = match
    return {handle, rkey}
  }

  return undefined
}
