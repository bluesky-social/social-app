// Regex from the go implementation
// https://github.com/bluesky-social/indigo/blob/main/atproto/syntax/handle.go#L10
import {decode} from 'punycode'

import {forceLTR} from '#/lib/strings/bidi'

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

export function sanitizeHandle(
  asciiHandle: string,
  prefix = '',
  allowUnicode = true,
): string {
  if (isInvalidHandle(asciiHandle)) {
    return '⚠Invalid Handle'
  }
  const handle = allowUnicode
    ? toSanitizedUnicodeHandle(asciiHandle)
    : asciiHandle
  return forceLTR(`${prefix}${handle}`)
}

export function toSanitizedUnicodeHandle(asciiHandle: string): string {
  const sanitizeHandle = asciiHandle
    .split('.')
    .map((label, index) => {
      const start = performance.now()
      if (!label.startsWith('xn--')) {
        return label // it's not an IDN label
      }
      const unicodeLabel = decode(label.slice(4))
      if (isHomographAttackPossible(unicodeLabel)) {
        return label
      }
      const elapsed = performance.now() - start
      console.log(`sanitizing IDN handle part ${index} took ${elapsed} ms`)
      return unicodeLabel
    })
    .join('.')
  return sanitizeHandle
}

const BANNED = 'BANNED'
const MIXING_ALLOWED = 'ALL' // Common (Zyyy) or Inherited (Zinh, Qaai)
const UNICODE_MAP = (() => {
  // Ranges are in ascending order, where the start codepoint of a range is either
  // - the code point 0, for the first item
  // - the previous' item lastCodePoint + 1, for all other items
  const partitions = [
    // Data from https://www.unicode.org/Public/16.0.0/ucdxml/
    // where the tag is the `sc` value of the <char>
    // Note: you can use https://symbl.cc/en/unicode-table/ as quick reference
    {lastCodePoint: 0x001f, tag: BANNED}, // control chars
    {lastCodePoint: 0x0040, tag: MIXING_ALLOWED},
    {lastCodePoint: 0x0048, tag: 'Latn'}, // [A-H]
    {lastCodePoint: 0x0049, tag: BANNED}, // 'I' is confusable with with 'l' in many fonts
    {lastCodePoint: 0x005a, tag: 'Latn'}, // [J-Z]
    {lastCodePoint: 0x0060, tag: MIXING_ALLOWED},
    {lastCodePoint: 0x007a, tag: 'Latn'}, // [a-z]
    {lastCodePoint: 0x007e, tag: MIXING_ALLOWED},
    {lastCodePoint: 0x00a1, tag: BANNED}, // control chars, &nbsp, inverted excl. mark
    {lastCodePoint: 0x00ac, tag: MIXING_ALLOWED},
    {lastCodePoint: 0x00ad, tag: BANNED}, // soft hyphen (invisible)
    {lastCodePoint: 0x00bf, tag: MIXING_ALLOWED},
    {lastCodePoint: 0x024f, tag: 'Latn'},
    {lastCodePoint: 0x02ff, tag: BANNED}, // International Phonetic Alphabet
    {lastCodePoint: 0x036f, tag: MIXING_ALLOWED}, // Combining Diacritics
    {lastCodePoint: 0x03ff, tag: 'Grek'},
    {lastCodePoint: 0x052f, tag: 'Cyrl'},
    {lastCodePoint: 0x058f, tag: 'Armn'},
    {lastCodePoint: 0x05ff, tag: 'Hebr'},
    {lastCodePoint: 0x06ff, tag: 'Arab'},
    {lastCodePoint: 0x074f, tag: 'Syrc'},
    {lastCodePoint: 0x077f, tag: 'Arab'},
    {lastCodePoint: 0x07bf, tag: 'Thaa'},
    {lastCodePoint: 0x07ff, tag: 'Nkoo'},
    {lastCodePoint: 0x083f, tag: 'Samr'},
    {lastCodePoint: 0x085f, tag: 'Mand'}, // Mandaic
    {lastCodePoint: 0x086f, tag: 'Syrc'}, // Syriac Suppl.
    {lastCodePoint: 0x08ff, tag: 'Arab'}, // Arabic Ext. A & B
    {lastCodePoint: 0x097f, tag: 'Deva'},
    {lastCodePoint: 0x09ff, tag: 'Beng'},
    // TODO : add the rest
  ]

  // "struct of arrays" for increased read performance
  return {
    ranges: partitions.map(({lastCodePoint}) => lastCodePoint),
    tags: partitions.map(({tag}) => tag),

    getTag(codePoint: number): string | null {
      for (let i = 0; i < this.ranges.length; i++) {
        const lastCodePoint = this.ranges[i]
        if (codePoint <= lastCodePoint) {
          return this.tags[i]
        }
      }
      return null
    },
  }
})()

/// Checks if the given unicode domain label may be subject to an
/// homograph attack (https://en.wikipedia.org/wiki/IDN_homograph_attack).
///
/// Applies a policy at least as restrictive as the Mozilla Firefox policy
/// (https://wiki.mozilla.org/IDN_Display_Algorithm).
///
/// This implements the "Single Script" restriction level 2 described in
/// https://www.unicode.org/reports/tr39/#Restriction_Level_Detection
function isHomographAttackPossible(unicodeLabel: string): boolean {
  // The "Highly Restrictive" restriction level 3 (which is more lenient than 2)
  // will be implemented later.

  if (unicodeLabel !== unicodeLabel.normalize('NFC')) {
    // RFC 5895 requires that unicode domain labels are in NFC form
    // (https://datatracker.ietf.org/doc/html/rfc5895)
    // (https://www.unicode.org/reports/tr46/)
    // If the given domain label is not in NFC form, it shouldn't be trusted.
    return true
  }

  // FIXME: this needs to be the "Resolved Script Set" of
  // https://www.unicode.org/reports/tr39/#Mixed_Script_Detection
  let uniqueScript: string | null = null

  const iterator = unicodeLabel[Symbol.iterator]()
  let next = iterator.next()

  while (!next.done) {
    const codePoint = next.value.codePointAt(0) as number
    next = iterator.next()
    const tag = UNICODE_MAP.getTag(codePoint)

    if (tag === BANNED) {
      return true // label isn't trusted
    } else if (tag === null || tag === MIXING_ALLOWED) {
      // can continue
    } else if (uniqueScript === null) {
      uniqueScript = tag
    } else if (uniqueScript !== tag) {
      return true // label isn't trusted
    }
  }

  return false // label is trusted
}

export interface IsValidHandle {
  handleChars: boolean
  hyphenStartOrEnd: boolean
  frontLength: boolean
  totalLength: boolean
  overall: boolean
}

// More checks from https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/handle/index.ts#L72
export function validateHandle(str: string, userDomain: string): IsValidHandle {
  const fullHandle = createFullHandle(str, userDomain)

  const results = {
    handleChars:
      !str || (VALIDATE_REGEX.test(fullHandle) && !str.includes('.')),
    hyphenStartOrEnd: !str.startsWith('-') && !str.endsWith('-'),
    frontLength: str.length >= 3,
    totalLength: fullHandle.length <= 253,
  }

  return {
    ...results,
    overall: !Object.values(results).includes(false),
  }
}
