import React from 'react'
import Svg, {Circle, Text, Defs, LinearGradient, Stop} from 'react-native-svg'
import {getGradient} from '../../lib/asset-gen'

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
