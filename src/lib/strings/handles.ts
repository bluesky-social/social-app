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
  return asciiHandle
    .split('.')
    .map((label: string) => {
      if (!label.startsWith('xn--')) {
        return label // it's not an IDN label
      }
      const unicodeLabel = decode(label.slice(4))
      if (isPossibleHomographAttack(unicodeLabel)) {
        return label
      }
      return unicodeLabel
    })
    .join('.')
}

/// Checks if the given unicode domain label may be subject to an
/// homograph attack (https://en.wikipedia.org/wiki/IDN_homograph_attack)
function isPossibleHomographAttack(unicodeLabel: string): boolean {
  let hasNonRFC2181Characters = false
  // We check for characters belonging to any script that has problematic homographs,
  // and only allow using __at most__ one of them.
  // Detection is based on the observation that legitimate domains in the wild do not mix those scripts.
  // Note: you can use https://symbl.cc/en/unicode-table/ as reference
  let hasLatin = false
  let hasIPA = false
  let hasGreekOrCoptic = false
  let hasCyrillic = false
  let hasArmenian = false
  let hasNKo = false

  const iterator = unicodeLabel[Symbol.iterator]()
  let next = iterator.next()
  while (!next.done) {
    const codePoint = next.value.codePointAt(0) as number

    if (codePoint <= 0x007f) {
      // Basic Latin
      const isLowercase = codePoint >= 0x0061 && codePoint <= 0x007a
      if (isLowercase) {
        hasLatin = true
      } else {
        const isUppercase = codePoint >= 0x0041 && codePoint <= 0x005a
        if (isUppercase) {
          if (codePoint === 0x0049 /* 'I' */) {
            return true // this is confusable with 'l' in many fonts
          }
          hasNonRFC2181Characters = true
          hasLatin = true
        } else {
          const isNumeric = codePoint >= 0x0030 && codePoint <= 0x0039
          if (!isNumeric && codePoint !== 0x002d /* '-' */) {
            hasNonRFC2181Characters = true
          }
        }
      }
    } else {
      hasNonRFC2181Characters = true

      if (codePoint <= 0x024f) {
        // Latin-1 Suppl., Latin Extended-A, Latin Extended-B
        hasLatin = true
      } else if (codePoint <= 0x02ff) {
        // IPA Extensions, Spacing Modifier Letters
        hasIPA = true
      } else if (codePoint <= 0x036f) {
        // Combining Diacritical Marks (i.e. accents)
        // do nothing
      } else if (codePoint <= 0x03ff) {
        // Greek and Coptic
        hasGreekOrCoptic = true
      } else if (codePoint <= 0x052f) {
        // Cyrillic, Cyrillic Suppl.
        hasCyrillic = true
      } else if (codePoint <= 0x058f) {
        // Armenian
        hasArmenian = true
      } else if (codePoint >= 0x070c && codePoint <= 0x07ff) {
        // NKo
        hasNKo = true
      } else if (codePoint >= 0xd800 && codePoint <= 0xffff) {
        // Surrogates, Combining and other high abuse potential codepoints.
        // These are basically never legitimate parts of a label.
        return true
      }
    }
    next = iterator.next()
  }

  if (!hasNonRFC2181Characters) {
    // The label contains only characters in [-a-z0-9] and may be a valid domain label,
    // therefore it did not need to be using punycode.
    // It should be regarded as a possible attack.
    return true
  }

  const scripts =
    Number(hasLatin) +
    Number(hasIPA) +
    Number(hasGreekOrCoptic) +
    Number(hasCyrillic) +
    Number(hasArmenian) +
    Number(hasNKo)
  return scripts > 1 // The label uses more than one confusable script
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
