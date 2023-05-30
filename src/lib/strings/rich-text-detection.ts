import {isValidDomain} from './url-helpers'

interface DetectedLink {
  link: string
}
type DetectedLinkable = string | DetectedLink
export function detectLinkables(text: string): DetectedLinkable[] {
  const re =
    /((^|\s|\()@[a-z0-9.-]*)|((^|\s|\()https?:\/\/[\S]+)|((^|\s|\()(?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*)/gi
  const segments = []
  let match
  let start = 0
  while ((match = re.exec(text))) {
    let matchIndex = match.index
    let matchValue = match[0]

    if (match.groups?.domain && !isValidDomain(match.groups?.domain)) {
      continue
    }

    if (/\s|\(/.test(matchValue)) {
      // HACK
      // skip the starting space
      // we have to do this because RN doesnt support negative lookaheads
      // -prf
      matchIndex++
      matchValue = matchValue.slice(1)
    }

    // strip ending punctuation
    if (/[.,;!?]$/.test(matchValue)) {
      matchValue = matchValue.slice(0, -1)
    }
    if (/[)]$/.test(matchValue) && !matchValue.includes('(')) {
      matchValue = matchValue.slice(0, -1)
    }

    if (start !== matchIndex) {
      segments.push(text.slice(start, matchIndex))
    }
    segments.push({link: matchValue})
    start = matchIndex + matchValue.length
  }
  if (start < text.length) {
    segments.push(text.slice(start))
  }
  return segments
}
