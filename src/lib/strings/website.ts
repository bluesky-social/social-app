export function sanitizeWebsiteForDisplay(website: string): string {
  return website.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

export function sanitizeWebsiteForLink(website: string): string {
  const normalized = website.toLowerCase()
  return normalized.startsWith('https')
    ? normalized
    : `https://${website.toLowerCase()}`
}

export function isValidWebsiteFormat(website: string): boolean {
  const trimmedWebsite = website?.trim() || ''

  if (!trimmedWebsite || trimmedWebsite.length === 0) {
    return true
  }

  const normalizedWebsite = trimmedWebsite.toLowerCase()

  if ('https://'.startsWith(normalizedWebsite)) {
    return true
  }

  if (!normalizedWebsite.match(/^https:\/\/.+/)) {
    return false
  }

  const domainMatch = normalizedWebsite.match(/^https:\/\/([^/\s]+)/)
  if (!domainMatch) {
    return false
  }

  const domain = domainMatch[1]

  // Check for valid domain structure:
  // - Must contain at least one dot
  // - Must have a valid TLD (at least 2 characters after the last dot)
  // - Cannot be just a single word without extension
  const domainPattern =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

  return domainPattern.test(domain)
}
