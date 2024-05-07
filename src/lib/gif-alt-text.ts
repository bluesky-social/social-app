// Kind of a hack. We needed some way to distinguish these.
const USER_ALT_PREFIX = 'Alt: '
const DEFAULT_ALT_PREFIX = 'ALT: '

export function createGIFDescription(
  tenorDescription: string,
  preferredAlt: string = '',
) {
  preferredAlt = preferredAlt.trim()
  if (preferredAlt !== '') {
    return USER_ALT_PREFIX + preferredAlt
  } else {
    return DEFAULT_ALT_PREFIX + tenorDescription
  }
}

export function parseAltFromGIFDescription(description: string): {
  isPreferred: boolean
  alt: string
} {
  if (description.startsWith(USER_ALT_PREFIX)) {
    return {
      isPreferred: true,
      alt: description.replace(USER_ALT_PREFIX, ''),
    }
  } else if (description.startsWith(DEFAULT_ALT_PREFIX)) {
    return {
      isPreferred: false,
      alt: description.replace(DEFAULT_ALT_PREFIX, ''),
    }
  }
  return {
    isPreferred: false,
    alt: description,
  }
}
