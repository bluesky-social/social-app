import React from 'react'
import {Text} from 'react-native'
import {TextStyle} from 'react-native'
import {Trans} from '@lingui/macro'
import tlds from 'tlds'
import {getPublicSuffix} from 'tldts'

import {isInvalidHandle} from '#/lib/strings/handles'
import {atoms as a, useTheme} from '#/alf'

// We can't really use `forceLTR()` here, because we'll be using
// rich text, so we use the unicode characters directly.
const LEFT_TO_RIGHT_EMBEDDING = '\u202A'
const POP_DIRECTIONAL_FORMATTING = '\u202C'

/**
 * A syntax highlighted version of a handle, to provide cues to the user about
 * the handle's structure, as well as to make spoofing attempts more visible.
 */
export function HighlightedHandle({
  handle,
  style,
  suffixStyle,
  spoofStyle,
}: {
  handle: string
  style?: TextStyle[] | TextStyle
  suffixStyle?: TextStyle[] | TextStyle
  spoofStyle?: TextStyle[] | TextStyle
}) {
  const t = useTheme()

  style ??= [t.atoms.text_contrast_medium]
  suffixStyle ??= [t.atoms.text_contrast_low]
  spoofStyle ??= [a.strike_through]

  const {prefix, spoof, suffix} = React.useMemo(
    () => getHandleParts(handle),
    [handle],
  )

  if (isInvalidHandle(handle)) {
    return (
      <Text style={style}>
        <Trans>⚠Invalid Handle</Trans>
      </Text>
    )
  }

  return (
    <Text style={style}>
      {LEFT_TO_RIGHT_EMBEDDING}@{prefix}
      {suffix != null && (
        <Text style={suffixStyle}>
          {spoof != null && (
            <>
              .<Text style={spoofStyle}>{spoof}</Text>
            </>
          )}
          .{suffix}
        </Text>
      )}
      {POP_DIRECTIONAL_FORMATTING}
    </Text>
  )
}

/**
 * Gets the suffix of a handle. We only consider private (non-ICANN) domains as suffixes.
 *
 * So `someone.example.com` will return `example.com` as a suffix, but `someone.co.uk` will return `undefined`.
 */
function getSuffix(handle: string) {
  const publicSuffix = getPublicSuffix(handle)
  if (publicSuffix) {
    const prefix = handle.slice(0, handle.length - publicSuffix.length - 1)
    if (!prefix.includes('.')) {
      return undefined // If we're right under a public suffix, we're not under a private domain
    }
    return handle.slice(prefix.indexOf('.') + 1)
  }
  return undefined
}

/**
 * Attemps to detect domain name spoofing in the suffix of a handle.
 *
 * E.g. someone might be attempting to trick the user into thinking they're
 * seeing `someone.bsky.social` but they're seeing `someone.bsky.social.fake-domain.com`.
 *
 * Not all “spoofed” domains detected by this method are necessarily malicious, e.g. a legitimate
 * use is mirroring content from somewhere else while having a somewhat matching handle.
 */
function getSpoof(suffix: string) {
  const publicSuffix = getPublicSuffix(suffix)
  if (publicSuffix == null) {
    return undefined
  }

  let parts = suffix
    .slice(0, suffix.length - publicSuffix.length - 1)
    .split('.')

  // ideally, we'd start at 0, but the ammount of gTLDs is so large
  // that we end up with a lot of false positives for very common words
  // in subdomains, like `blog`, `app`, `shop`, etc.
  for (let i = 1; i < parts.length; i++) {
    // TODO: perhaps we should use a more restrictive list of gTLDs to avoid false positives
    if (tlds.includes(parts[i])) {
      return parts.slice(0, i + 1).join('.')
    }
  }

  return undefined
}

/**
 * Splits a handle into three possible parts: prefix, spoof, and suffix.
 *
 * Only the prefix is guaranteed to be present, the other two are optional.
 * Additionally, the spoof can only be present if the suffix is present.
 */
function getHandleParts(handle: string): {
  prefix: string
  spoof?: string
  suffix?: string
} {
  // Attempt to get a suffix
  const suffix = getSuffix(handle)
  if (suffix == null) {
    // If there's no sufix, the entire handle is the prefix, and therefore there's no spoof
    return {prefix: handle}
  }

  // Obtain the prefix by removing the suffix
  const prefix = handle.slice(0, handle.length - suffix.length - 1)

  // Check if there's a spoof
  const spoof = getSpoof(suffix)
  if (spoof == null) {
    // If there's no spoof, the entire suffix remains as is, returning the prefix and suffix
    return {prefix, suffix}
  }

  // If there's a spoof, we remove it from the suffix, and return everything
  return {
    prefix,
    spoof,
    suffix: suffix.slice(spoof.length + 1),
  }
}
