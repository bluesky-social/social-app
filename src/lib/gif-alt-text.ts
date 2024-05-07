const USER_ALT_PREFIX = 'User-provided alt text: '
const DEFAULT_ALT_PREFIX = 'ALT: '

export function createGIFDescription(
  tenorDescription: string,
  preferredAlt?: string,
) {
  if (!preferredAlt) {
    return DEFAULT_ALT_PREFIX + tenorDescription
  }
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
  console.log('description', description)
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
