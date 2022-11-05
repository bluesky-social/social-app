import React from 'react'
import Svg, {Circle, Text, Defs, LinearGradient, Stop} from 'react-native-svg'
import {colors} from '../../lib/styles'

const GRADIENTS = [
  [colors.pink3, colors.purple3],
  [colors.purple3, colors.blue3],
  [colors.blue3, colors.green3],
  [colors.red3, colors.pink3],
]

export function UserAvatar({
  size,
  displayName,
  handle,
}: {
  size: number
  displayName: string | undefined
  handle: string
}) {
  const initials = getInitials(displayName || handle)
  const gradient = getGradient(handle)
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={gradient[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={gradient[1]} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#grad)" />
      <Text
        fill="white"
        fontSize="50"
        fontWeight="bold"
        x="50"
        y="67"
        textAnchor="middle">
        {initials}
      </Text>
    </Svg>
  )
}

export function getGradient(handle: string): string[] {
  const gi = cyrb53(handle) % GRADIENTS.length
  return GRADIENTS[gi]
}

function getInitials(str: string): string {
  const tokens = str
    .split(' ')
    .filter(Boolean)
    .map(v => v.trim())
  if (tokens.length >= 2 && tokens[0][0] && tokens[0][1]) {
    return tokens[0][0].toUpperCase() + tokens[1][0].toUpperCase()
  }
  if (tokens.length === 1 && tokens[0][0]) {
    return tokens[0][0].toUpperCase()
  }
  return 'X'
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
