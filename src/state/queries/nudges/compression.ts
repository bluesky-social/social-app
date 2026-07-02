/*
 * This module provides functions to pack and unpack flags into a compact
 * binary format for storage in our NUX system. Given the max length of 300
 * characters, and a 6-bit encoding scheme, we can store up to 1800 flags in a
 * single string.
 */

const TRUTHY = '1'
const FALSY = '0'

/**
 * Total number of characters that flags can be packed. This corresponds to the
 * max-length of a NUX.
 */
const MAX_FLAGS = 300

/**
 * Length of binary string chunks used to encode flags.
 */
const CHAR_CODE_LENGTH = 6

export function pack(flags: Record<string, boolean>) {
  const values = Object.values(flags)

  if (values.length > MAX_FLAGS) {
    throw new Error(`Too many flags. Maximum supported is ${MAX_FLAGS}`)
  }

  /*
   * Splits `compactBinaryNotation` string into 6 char chunks of 0s and 1s.
   */
  const compactBinaryNotation = values
    .map(value => (value ? TRUTHY : FALSY))
    .join('')
  const matcher = new RegExp(`.{1,${CHAR_CODE_LENGTH}}`, 'g')
  const encoded = (compactBinaryNotation.match(matcher) || [])
    .map(chunk =>
      String.fromCharCode(parseInt(chunk.padEnd(CHAR_CODE_LENGTH, '0'), 2)),
    )
    .join('')

  return encoded
}

export function unpack<K extends string>(encoded: string, keys: K[]) {
  const compactBinaryNotation = encoded
    .split('')
    .map(char => char.charCodeAt(0).toString(2).padEnd(CHAR_CODE_LENGTH, '0'))
    .join('')

  return keys.reduce((obj, key, i) => {
    obj[key] = compactBinaryNotation[i] === TRUTHY
    return obj
  }, {} as Record<K, boolean>)
}
