import {type RichText} from '@bsky.app/sdk/richtext'

import {type app} from '#/lexicons'

export type LinkFacetMatch = {
  rt: RichText
  facet: app.bsky.richtext.facet.Main
}

export function suggestLinkCardUri(
  suggestLinkImmediately: boolean,
  nextDetectedUris: Map<string, LinkFacetMatch>,
  prevDetectedUris: Map<string, LinkFacetMatch>,
  pastSuggestedUris: Set<string>,
): string | undefined {
  const suggestedUris = new Set<string>()
  for (const [uri, nextMatch] of nextDetectedUris) {
    if (!isValidUrlAndDomain(uri)) {
      continue
    }
    if (pastSuggestedUris.has(uri)) {
      // Don't suggest already added or already dismissed link cards.
      continue
    }
    if (suggestLinkImmediately) {
      // Immediately add the pasted or intent-prefilled link without waiting to type more.
      suggestedUris.add(uri)
      continue
    }
    const prevMatch = prevDetectedUris.get(uri)
    if (!prevMatch) {
      // If the same exact link wasn't already detected during the last keystroke,
      // it means you're probably still typing it. Disregard until it stabilizes.
      continue
    }
    const prevTextAfterUri = prevMatch.rt.unicodeText.slice(
      prevMatch.facet.index.byteEnd,
    )
    const nextTextAfterUri = nextMatch.rt.unicodeText.slice(
      nextMatch.facet.index.byteEnd,
    )
    if (prevTextAfterUri === nextTextAfterUri) {
      // The text you're editing is before the link, e.g.
      // "abc google.com" -> "abcd google.com".
      // This is a good time to add the link.
      suggestedUris.add(uri)
      continue
    }
    if (/^\s/m.test(nextTextAfterUri)) {
      // The link is followed by a space, e.g.
      // "google.com" -> "google.com " or
      // "google.com." -> "google.com ".
      // This is a clear indicator we can linkify it.
      suggestedUris.add(uri)
      continue
    }
    if (
      /^[)]?[.,:;!?)](\s|$)/m.test(prevTextAfterUri) &&
      /^[)]?[.,:;!?)]\s/m.test(nextTextAfterUri)
    ) {
      // The link was *already* being followed by punctuation,
      // and now it's followed both by punctuation and a space.
      // This means you're typing after punctuation, e.g.
      // "google.com." -> "google.com. " or
      // "google.com.foo" -> "google.com. foo".
      // This means you're not typing the link anymore, so we can linkify it.
      suggestedUris.add(uri)
      continue
    }
  }
  for (const uri of pastSuggestedUris) {
    if (!nextDetectedUris.has(uri)) {
      // If a link is no longer detected, it's eligible for suggestions next time.
      pastSuggestedUris.delete(uri)
    }
  }

  let suggestedUri: string | undefined
  if (suggestedUris.size > 0) {
    suggestedUri = Array.from(suggestedUris)[0]
    pastSuggestedUris.add(suggestedUri)
  }

  return suggestedUri
}

/**
 * A single alphanumeric domain character (unicode letters or digits).
 */
const DOMAIN_ALNUM = /^[a-z\u00a1-\uffff0-9]$/i
/**
 * The final label (TLD): unicode letters only, 2 or more characters. Single
 * repetition of a non-overlapping class, so this is linear-time.
 */
const DOMAIN_TLD = /^[a-z\u00a1-\uffff]{2,}$/i

/**
 * Validates a single non-final domain label: unicode letters/digits with
 * interior hyphens only (hyphen may not lead or trail), at least one character.
 * Implemented charwise to stay unambiguously linear-time (no backtracking).
 */
function isValidDomainLabel(label: string): boolean {
  if (label.length === 0) return false
  if (!DOMAIN_ALNUM.test(label[0])) return false
  if (!DOMAIN_ALNUM.test(label[label.length - 1])) return false
  for (let i = 1; i < label.length - 1; i++) {
    const ch = label[i]
    if (ch !== '-' && !DOMAIN_ALNUM.test(ch)) return false
  }
  return true
}
/**
 * Exactly four dot-separated groups of 1-3 digits. Anchored and bounded, so it
 * fails fast without backtracking.
 */
const IPV4_SHAPE = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/

/**
 * Validates a public IPv4 host, matching the octet ranges and private-range
 * rejections of the original regex: first octet 1-223, middle octets 0-255,
 * last octet 1-254; rejects 10.x, 127.x, 169.254.x, 192.168.x, and
 * 172.16-31.x.
 */
function isPublicIpv4Host(host: string): boolean {
  const [a, b, c, d] = host.split('.').map(Number)
  if (a < 1 || a > 223) return false
  if (b < 0 || b > 255) return false
  if (c < 0 || c > 255) return false
  if (d < 1 || d > 254) return false
  if (a === 10 || a === 127) return false
  if (a === 169 && b === 254) return false
  if (a === 192 && b === 168) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  return true
}

/**
 * Validates a hostname as a domain name: at least two labels, every non-final
 * label a valid domain label, and a final letters-only TLD of 2+ characters.
 */
function isValidDomainHost(host: string): boolean {
  const labels = host.split('.')
  if (labels.length < 2) return false
  if (!DOMAIN_TLD.test(labels[labels.length - 1])) return false
  for (let i = 0; i < labels.length - 1; i++) {
    if (!isValidDomainLabel(labels[i])) return false
  }
  return true
}

/*
 * Rewritten (was a single StackOverflow URL regex with nested quantifiers that
 * CodeQL flagged as ReDoS-prone - see git history). This runs on every composer
 * keystroke via suggestLinkCardUri, so it must be linear-time. Behavior is
 * preserved: the string must start with http://, https://, ftp://, or a
 * protocol-relative //; may carry userinfo; the host is a public IPv4 or a
 * domain name; an optional 2-5 digit port; and an optional path/query/fragment
 * with no whitespace. Every regex below is applied to a bounded slice with no
 * nested quantifiers.
 *
 * Original StackOverflow attribution:
 * https://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url
 * question credit Muhammad Imran Tariq https://stackoverflow.com/users/420613/muhammad-imran-tariq
 * answer credit Christian David https://stackoverflow.com/users/967956/christian-david
 */
function isValidUrlAndDomain(value: string) {
  // The whole match forbids whitespace (\S / anchored), so bail early.
  if (/\s/.test(value)) return false

  // A leading // is required; the scheme, if present, must be http/https/ftp.
  let rest: string
  if (value.startsWith('http://')) rest = value.slice('http://'.length)
  else if (value.startsWith('https://')) rest = value.slice('https://'.length)
  else if (value.startsWith('ftp://')) rest = value.slice('ftp://'.length)
  else if (value.startsWith('//')) rest = value.slice('//'.length)
  else return false

  // The authority ends at the first path/query/fragment delimiter.
  const authorityEnd = rest.search(/[/?#]/)
  const authority = authorityEnd === -1 ? rest : rest.slice(0, authorityEnd)

  // Optional userinfo: greedy up to the last @ (as \S+(?::\S*)?@ would match).
  let hostPort = authority
  const at = authority.lastIndexOf('@')
  if (at !== -1) {
    if (at === 0) return false // userinfo must be non-empty
    hostPort = authority.slice(at + 1)
  }

  // Optional :port of 2-5 digits.
  let host = hostPort
  const colon = hostPort.lastIndexOf(':')
  if (colon !== -1) {
    const port = hostPort.slice(colon + 1)
    if (!/^\d{2,5}$/.test(port)) return false
    host = hostPort.slice(0, colon)
  }

  if (IPV4_SHAPE.test(host)) return isPublicIpv4Host(host)
  return isValidDomainHost(host)
}
