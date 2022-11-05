import React from 'react'
import Svg, {Rect, Defs, LinearGradient, Stop} from 'react-native-svg'
import {getGradient} from '../../lib/asset-gen'

export function UserBanner({handle}: {handle: string}) {
  const gradient = getGradient(handle)
  return (
    <Svg width="100%" height="120" viewBox="50 0 200 100">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={gradient[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={gradient[1]} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fff" stopOpacity="0" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="400" height="100" fill="url(#grad)" />
      <Rect x="0" y="0" width="400" height="100" fill="url(#grad2)" />
    </Svg>
  )
}
