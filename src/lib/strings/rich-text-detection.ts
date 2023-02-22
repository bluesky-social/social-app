import {AppBskyFeedPost} from '@atproto/api'
type Entity = AppBskyFeedPost.Entity
import {isValidDomain} from './url-helpers'

export function extractEntities(
  text: string,
  knownHandles?: Set<string>,
): Entity[] | undefined {
  let match
  let ents: Entity[] = []
  {
    // mentions
    const re = /(^|\s|\()(@)([a-zA-Z0-9.-]+)(\b)/g
    while ((match = re.exec(text))) {
      if (knownHandles && !knownHandles.has(match[3])) {
        continue // not a known handle
      } else if (!match[3].includes('.')) {
        continue // probably not a handle
      }
      const start = text.indexOf(match[3], match.index) - 1
      ents.push({
        type: 'mention',
        value: match[3],
        index: {start, end: start + match[3].length + 1},
      })
    }
  }
  {
    // links
    const re =
      /(^|\s|\()((https?:\/\/[\S]+)|((?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*))/gim
    while ((match = re.exec(text))) {
      let value = match[2]
      if (!value.startsWith('http')) {
        const domain = match.groups?.domain
        if (!domain || !isValidDomain(domain)) {
          continue
        }
        value = `https://${value}`
      }
      const start = text.indexOf(match[2], match.index)
      const index = {start, end: start + match[2].length}
      // strip ending puncuation
      if (/[.,;!?]$/.test(value)) {
        value = value.slice(0, -1)
        index.end--
      }
      if (/[)]$/.test(value) && !value.includes('(')) {
        value = value.slice(0, -1)
        index.end--
      }
      ents.push({
        type: 'link',
        value,
        index,
      })
    }
  }
  return ents.length > 0 ? ents : undefined
}

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

    // strip ending puncuation
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
