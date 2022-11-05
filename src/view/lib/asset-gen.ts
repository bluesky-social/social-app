import {colors} from './styles'

const GRADIENTS = [
  [colors.pink3, colors.purple3],
  [colors.purple3, colors.blue3],
  [colors.blue3, colors.green3],
  [colors.red3, colors.pink3],
]

export function getGradient(handle: string): string[] {
  const gi = cyrb53(handle) % GRADIENTS.length
  return GRADIENTS[gi]
}

// deterministic string->hash
// https://stackoverflow.com/a/52171480
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}
