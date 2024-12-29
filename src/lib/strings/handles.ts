// Regex from the go implementation
// https://github.com/bluesky-social/indigo/blob/main/atproto/syntax/handle.go#L10
import {decode} from 'punycode'

import {forceLTR} from '#/lib/strings/bidi'
import {
  BANNED,
  MIXED_SCRIPTS_AUGMENTATIONS,
  MIXING_ALLOWED,
  PARTITIONS_BY_SCRIPTS,
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
    .map(label => {
      // const start = performance.now()
      if (!label.startsWith('xn--')) {
        return label // it's not an IDN label
      }
      try {
        const unicodeLabel = decode(label.slice(4))
        if (isHomographAttackPossible(unicodeLabel)) {
          return label
        }
        // const elapsed = performance.now() - start
        // console.debug(`took ${elapsed} ms to sanitize ${label}`)
        return unicodeLabel
      } catch (e) {
        // the label does not seem to be valid punycode
        return label
      }
    })
    .join('.')
  return sanitizedHandle
}

function toUCPN(codepoint: number): string {
  return `U+${codepoint.toString(16).padStart(4, '0')}`
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
  const DEBUG_FUNC = false

  if (DEBUG_FUNC) console.log(`Checking "${unicodeLabel}"`)

  if (unicodeLabel !== unicodeLabel.normalize('NFC')) {
    // RFC 5895 requires unicode domain labels to be in NFC form.
    // (https://datatracker.ietf.org/doc/html/rfc5895)
    // (https://www.unicode.org/reports/tr46/)
    // If the given domain label is not in NFC form, it shouldn't be trusted.
    if (DEBUG_FUNC) console.log(`"${unicodeLabel}" is not in NFC form`)
    return true
  }

  let resolvedScriptSet: Set<string> | null = null

  for (const character of unicodeLabel) {
    const codepoint = character.codePointAt(0) as number
    const scriptOrScriptSet = getScriptOrAugmentedScriptSet(codepoint)

    if (typeof scriptOrScriptSet === 'string') {
      // Codepoint has a single script
      const scriptTag = scriptOrScriptSet
      if (DEBUG_FUNC) {
        console.debug(
          `analysing ${toUCPN(codepoint)}: script is "${scriptTag}"`,
        )
      }
      if (scriptTag === BANNED) {
        if (DEBUG_FUNC) {
          const ucpn = `U+${codepoint.toString(16).padStart(4, '0')}`
          const char = String.fromCodePoint(codepoint)
          console.log(`"${unicodeLabel}" has banned ${ucpn} "${char}"`)
        }
        return true // banned codepoint, not trusted
      } else if (scriptTag === MIXING_ALLOWED) {
        // skip this codepoint
      } else if (resolvedScriptSet === null) {
        // this is the first tag that matches a script
        resolvedScriptSet = new Set()
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
      const augmentedScriptSet = scriptOrScriptSet
      if (DEBUG_FUNC) {
        const scripts = [...augmentedScriptSet].join(', ')
        console.log(`analysing codepoint: scripts are ${scripts}`)
      }
      if (resolvedScriptSet === null) {
        // this is the first codepoint that has scripts
        resolvedScriptSet = augmentedScriptSet
      } else {
        setIntersection(resolvedScriptSet, augmentedScriptSet)
        if (resolvedScriptSet.size === 0) {
          // The intersection of the prefix codepoints' string sets and this codepoint's script set is empty
          // so the Resolved Script Set for the string up to this codepoint is empty,
          // so the string is not Single Script and we don't need to check further.
          if (DEBUG_FUNC) {
            const hex = codepoint.toString(16).padStart(4, '0')
            const char = String.fromCodePoint(codepoint)
            console.log(`"${unicodeLabel}" empty RSS from U+${hex} "${char}"`)
          }
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

/// Finds the index of the partition that x belongs in.
/// Retuns -1 if x does not belong to any partition.
///
/// Each partition is the range of nonnegative integers
/// [partitions[i-1]+1 ..= partitions[i]]
/// i.e. the partition at index i is the range of integers from
/// partitions[i-1]+1 up to and including partitions[i].
/// The partition at index 0 is the range [0 ..= partitions[0]].
///
/// Precondition: partitions is sorted in ascending order and not empty
export function findPartitionIndex(partitions: number[], x: number): number {
  let lowerBound = 0
  let upperBound = partitions.length // after last partition
  // invariant: lowerBound <= i <= upperBound and i < partitions.length
  let i = (partitions.length - 1) >> 1
  // let iterations = 0

  while (true) {
    // iterations++
    const partitionEnd = partitions[i]
    if (x < partitionEnd) {
      // the target partition index is larger or equal to i
      upperBound = i
    } else if (x === partitionEnd) {
      // console.debug(`findPartitionIndex: took ${iterations} iterations (exit A)`)
      return i // found
    } /* partitionEnd < x */ else {
      if (i + 1 >= partitions.length) {
        // console.debug(`findPartitionIndex: took ${iterations} iterations (exit B)`)
        return -1 // x is larger than all partitions
      }
      // the target partition index is larger than i
      lowerBound = i + 1
    }
    if (lowerBound === upperBound) {
      // console.debug(`findPartitionIndex: took ${iterations} iterations (exit C)`)
      return lowerBound // found
    }
    i = lowerBound + ((upperBound - lowerBound) >> 1)
  }
}

function getScriptOrAugmentedScriptSet(
  codepoint: number,
): string | Set<string> {
  const index = findPartitionIndex(
    PARTITIONS_BY_SCRIPTS.partitionEnds,
    codepoint,
  )
  if (index < 0) {
    return BANNED // unknown codepoint
  }
  let tag = PARTITIONS_BY_SCRIPTS.tags[index]
  if (tag.includes(' ')) {
    // split tag into scripts
    const extendedScripts = tag.split(' ')
    const augmentedScriptSet = new Set(extendedScripts)
    extendedScripts.forEach(script => {
      // follow augmentation rules
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
      // no augmentation needed (typical case)
      return extendedScript
    }
  }
}
