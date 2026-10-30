import bidiFactory from 'bidi-js'

const bidi = bidiFactory()

/**
 * Checks the first strong directional character, matching HTML `dir="auto"`.
 */
export function isRTLText(text: string) {
  for (const character of text) {
    const type = bidi.getBidiCharTypeName(character)

    if (type === 'R' || type === 'AL') return true
    if (type === 'L') return false
  }

  return false
}
