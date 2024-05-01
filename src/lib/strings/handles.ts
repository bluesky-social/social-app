// Regex from the go implementation
// https://github.com/bluesky-social/indigo/blob/main/atproto/syntax/handle.go#L10
const VALIDATE_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

export function makeValidHandle(str: string): string {
  if (str.length > 20) {
    str = str.slice(0, 20)
  }
  str = str.toLowerCase()
  return str.replace(/^[^a-z0-9]+/g, '').replace(/[^a-z0-9-]/g, '')
}

export function createFullHandle(name: string, domain: string): string {
  name = (name || '').replace(/[.]+$/, '')
  domain = (domain || '').replace(/^[.]+/, '')
  return `${name}.${domain}`
}

export function isInvalidHandle(handle: string): boolean {
  return handle === 'handle.invalid'
}

export function sanitizeHandle(handle: string, prefix = ''): string {
  return isInvalidHandle(handle) ? '⚠Invalid Handle' : `${prefix}${handle}`
}

type ValidateHandleResult =
  | 'charsError'
  | 'hyphenError'
  | 'frontLengthError'
  | 'totalLengthError'
  | 'valid'

// More checks from https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/handle/index.ts#L72
export function validateHandle(
  str: string,
  userDomain: string,
): ValidateHandleResult {
  const fullHandle = createFullHandle(str, userDomain)

  if (str.length < 3) {
    return 'frontLengthError'
  }
  if (fullHandle.length > 253) {
    return 'totalLengthError'
  }
  if (str.startsWith('-') || str.endsWith('-')) {
    return 'hyphenError'
  }
  if (!str || !VALIDATE_REGEX.test(fullHandle) || str.includes('.')) {
    return 'charsError'
  }

  return 'valid'
}
