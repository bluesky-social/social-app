import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import Svg, {Circle, Line, G, Path} from 'react-native-svg'

export function GridIcon({style}: {style?: StyleProp<ViewStyle>}) {
  const DIM = 4
  const ARC = 2
  return (
    <Svg width="24" height="24" style={style}>
      <Path
        d={`M4,1 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
      />
      <Path
        d={`M16,1 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
      />
      <Path
        d={`M4,13 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
      />
      <Path
        d={`M16,13 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
      />
    </Svg>
  )
}

export function HomeIcon({style}: {style?: StyleProp<ViewStyle>}) {
  return (
    <Svg viewBox="0 0 48 48" width="24" height="24" style={style}>
      <Path
        strokeWidth={4}
        stroke="#000"
        d="M 23.951 2 C 23.631 2.011 23.323 2.124 23.072 2.322 L 8.859 13.52 C 7.055 14.941 6 17.114 6 19.41 L 6 38.5 C 6 39.864 7.136 41 8.5 41 L 18.5 41 C 19.864 41 21 39.864 21 38.5 L 21 28.5 C 21 28.205 21.205 28 21.5 28 L 26.5 28 C 26.795 28 27 28.205 27 28.5 L 27 38.5 C 27 39.864 28.136 41 29.5 41 L 39.5 41 C 40.864 41 42 39.864 42 38.5 L 42 19.41 C 42 17.114 40.945 14.941 39.141 13.52 L 24.928 2.322 C 24.65 2.103 24.304 1.989 23.951 2 Z"
      />
    </Svg>
  )
}
