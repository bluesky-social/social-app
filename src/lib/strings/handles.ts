// Regex from the go implementation
// https://github.com/bluesky-social/indigo/blob/main/atproto/syntax/handle.go#L10
import {decode} from 'punycode'

import {forceLTR} from '#/lib/strings/bidi'
import {
  BANNED,
  MIXED_SCRIPTS_AUGMENTATIONS,
  MIXING_ALLOWED,
  PARTITIONS_BY_SCRIPT,
} from './unicode-map'

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

export function toSanitizedUnicodeHandle(asciiHandle: string): string {
  const sanitizedHandle = asciiHandle
    .split('.')
    .map((label, _index) => {
      const start = performance.now()
      if (!label.startsWith('xn--')) {
        return label // it's not an IDN label
      }
      const unicodeLabel = decode(label.slice(4))
      if (isHomographAttackPossible(unicodeLabel)) {
        return label
      }
      const elapsed = performance.now() - start
      console.log(`sanitizing IDN handle part ${_index} took ${elapsed} ms`)
      return unicodeLabel
    })
    .join('.')
  return sanitizedHandle
}

/// Checks if the given unicode domain label may be subject to an
/// homograph attack (https://en.wikipedia.org/wiki/IDN_homograph_attack).
///
/// Applies a policy at least as restrictive as the Mozilla Firefox policy
/// (https://wiki.mozilla.org/IDN_Display_Algorithm).
///
/// Currently, it follows Restriction Level 2 (Single Script) of
/// https://www.unicode.org/reports/tr39/#Restriction_Level_Detection
function isHomographAttackPossible(unicodeLabel: string): boolean {
  const DEBUG_ATTACK = false

  if (DEBUG_ATTACK) console.log(`Checking "${unicodeLabel}"`)

  if (unicodeLabel !== unicodeLabel.normalize('NFC')) {
    // RFC 5895 requires unicode domain labels to be in NFC form.
    // (https://datatracker.ietf.org/doc/html/rfc5895)
    // (https://www.unicode.org/reports/tr46/)
    // If the given domain label is not in NFC form, it shouldn't be trusted.
    if (DEBUG_ATTACK) console.log(`"${unicodeLabel}" is not in NFC form`)
    return true
  }

  if (unicodeLabel !== unicodeLabel.toLowerCase()) {
    // RFC 5895 requires domains to be lowercase.
    if (DEBUG_ATTACK) console.log(`"${unicodeLabel}" is not lowercase`)
    return true
  }

  let resolvedScriptSet: Set<string> = new Set()

  const iterator = unicodeLabel[Symbol.iterator]()
  let next = iterator.next()

  while (!next.done) {
    const codepoint = next.value.codePointAt(0) as number
    next = iterator.next()
    const sass = getAugmentedScriptSet(codepoint)

    if (typeof sass === 'string') {
      // Codepoint has a single script
      const scriptTag = sass
      if (DEBUG_ATTACK)
        console.log(`analysing ${toHex(codepoint)}: script is "${scriptTag}"`)
      if (scriptTag === BANNED) {
        if (DEBUG_ATTACK) {
          const ucpn = toUCPN(codepoint)
          const char = String.fromCodePoint(codepoint)
          console.log(`"${unicodeLabel}" has a banned ${ucpn} "${char}"`)
        }
        return true // banned codepoint, not trusted
      } else if (scriptTag === MIXING_ALLOWED) {
        // skip this codepoint
      } else if (resolvedScriptSet.size === 0) {
        // this is the first tag that matches a script
        resolvedScriptSet.add(scriptTag)
      } else {
        // perform set intersection
        if (resolvedScriptSet.has(scriptTag)) {
          resolvedScriptSet = new Set()
          resolvedScriptSet.add(scriptTag)
        } else {
          // The intersection of resolvedScriptSet and {scriptTag} is empty,
          // therefore the string cannot be "single script"
          return true
        }
      }
    } else {
      // Codepoint has multiple scripts
      const augmentedScriptSet = sass
      if (DEBUG_ATTACK) {
        const scripts = [...augmentedScriptSet].join(', ')
        console.log(`analysing codepoint: scripts are ${scripts}`)
      }
      if (resolvedScriptSet.size === 0) {
        // this is the first codepoint that has scripts
        resolvedScriptSet = augmentedScriptSet
      } else {
        setIntersection(resolvedScriptSet, augmentedScriptSet)
        if (resolvedScriptSet.size === 0) {
          // The intersection of the prefix codepoints' string sets and this codepoint's script set is empty
          // so the Resolved Script Set for the string up to this codepoint is empty,
          // so the string is not Single Script and we don't need to check further.
          if (DEBUG_ATTACK)
            console.log(
              `"${unicodeLabel}" empty RSS from ${toUCPN(
                codepoint,
              )} "${String.fromCodePoint(codepoint)}"`,
            )
          return true
        }
      }
    }
  }

  return false // label is trusted
}

/// Computes the set intersection of the two arguments,
/// by modifying the first argument such that it's equal to the result.
/// The second set is left untouched.
function setIntersection(setToModify: Set<string>, other: Set<string>) {
  const leftItems = [...setToModify]
  leftItems.forEach(item => {
    if (!other.has(item)) {
      setToModify.delete(item)
    }
  })
}

export function getPartitionIndex(partitions: number[], x: number): number {
  let lowestPossibleIndex = 0
  let highestPossibleIndex = partitions.length - 1
  // invariant: lowest <= i <= highest
  let i = Math.floor(partitions.length / 2)

  while (true) {
    let partitionEnd = partitions[i]
    if (x < partitionEnd) {
      // the target partition is at i, or lower
      highestPossibleIndex = Math.min(i, highestPossibleIndex)
      if (lowestPossibleIndex === highestPossibleIndex) {
        return i // found
      }
      // look at lower i's
      i =
        lowestPossibleIndex +
        Math.floor((highestPossibleIndex - lowestPossibleIndex) / 2)
    } else if (x === partitionEnd) {
      return i // found
    } /* item < codepoint */ else {
      // the target partition is at a higher i (or x is larger than all partitions)
      if (i + 1 >= partitions.length) {
        return -1 // x is larger than all partitions
      }
      lowestPossibleIndex = Math.max(i + 1, lowestPossibleIndex)
      // look at higher i's
      i =
        lowestPossibleIndex +
        Math.ceil((highestPossibleIndex - lowestPossibleIndex) / 2)
    }
  }
}

function getAugmentedScriptSet(codepoint: number): string | Set<string> {
  const index = getPartitionIndex(PARTITIONS_BY_SCRIPT.partitionEnds, codepoint)
  if (index >= 0) {
    // found the codepoint's group
    let tag = PARTITIONS_BY_SCRIPT.tags[index]
    if (tag.includes(' ')) {
      // split tag into scripts, and follow augmentation rules
      const extendedScripts = tag.split(' ')
      const augmentedScriptSet = new Set(extendedScripts)
      extendedScripts.forEach(script => {
        MIXED_SCRIPTS_AUGMENTATIONS[script]?.forEach(augmentation => {
          augmentedScriptSet.add(augmentation)
        })
      })
      return augmentedScriptSet
    } else {
      const extendedScript = tag
      const augmentations = MIXED_SCRIPTS_AUGMENTATIONS[extendedScript]
      if (augmentations) {
        // follow augmentation rule
        return new Set([extendedScript, ...augmentations])
      } else {
        // no augmentation needed (usual case)
        return extendedScript
      }
    }
  } else {
    return BANNED // unknown codepoint
  }
}
