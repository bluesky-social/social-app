import React from 'react'
import {StyleProp, TextStyle, ViewStyle} from 'react-native'
import Svg, {Path, Rect, Line, Ellipse, Circle} from 'react-native-svg'

export function GridIcon({
  style,
  solid,
}: {
  style?: StyleProp<ViewStyle>
  solid?: boolean
}) {
  const DIM = 4
  const ARC = 2
  return (
    <Svg width="24" height="24" style={style}>
      <Path
        d={`M4,1 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
        fill={solid ? '#000' : undefined}
      />
      <Path
        d={`M16,1 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
        fill={solid ? '#000' : undefined}
      />
      <Path
        d={`M4,13 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
        fill={solid ? '#000' : undefined}
      />
      <Path
        d={`M16,13 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
        fill={solid ? '#000' : undefined}
      />
    </Svg>
  )
}
export function GridIconSolid({style}: {style?: StyleProp<ViewStyle>}) {
  return <GridIcon style={style} solid />
}

export function HomeIcon({
  style,
  size,
  strokeWidth = 4,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      viewBox="0 0 48 48"
      width={size || 24}
      height={size || 24}
      stroke="currentColor"
      fill="none"
      style={style}>
      <Path
        strokeWidth={strokeWidth}
        d="M 23.951 2 C 23.631 2.011 23.323 2.124 23.072 2.322 L 8.859 13.52 C 7.055 14.941 6 17.114 6 19.41 L 6 38.5 C 6 39.864 7.136 41 8.5 41 L 18.5 41 C 19.864 41 21 39.864 21 38.5 L 21 28.5 C 21 28.205 21.205 28 21.5 28 L 26.5 28 C 26.795 28 27 28.205 27 28.5 L 27 38.5 C 27 39.864 28.136 41 29.5 41 L 39.5 41 C 40.864 41 42 39.864 42 38.5 L 42 19.41 C 42 17.114 40.945 14.941 39.141 13.52 L 24.928 2.322 C 24.65 2.103 24.304 1.989 23.951 2 Z"
      />
    </Svg>
  )
}

export function HomeIconSolid({
  style,
  size,
  strokeWidth = 4,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      viewBox="0 0 48 48"
      width={size || 24}
      height={size || 24}
      stroke="currentColor"
      style={style}>
      <Path
        fill="currentColor"
        strokeWidth={strokeWidth}
        d="m 23.951,2 c -0.32,0.011 -0.628,0.124 -0.879,0.322 L 8.859,13.52 C 7.055,14.941 6,17.114 6,19.41 V 38.5 C 6,39.864 7.136,41 8.5,41 h 8 c 1.364,0 2.5,-1.136 2.5,-2.5 v -12 C 19,26.205 19.205,26 19.5,26 h 9 c 0.295,0 0.5,0.205 0.5,0.5 v 12 c 0,1.364 1.136,2.5 2.5,2.5 h 8 C 40.864,41 42,39.864 42,38.5 V 19.41 c 0,-2.296 -1.055,-4.469 -2.859,-5.89 L 24.928,2.322 C 24.65,2.103 24.304,1.989 23.951,2 Z"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function MagnifyingGlassIcon({
  style,
  size,
  strokeWidth = 2,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </Svg>
  )
}

export function MagnifyingGlassIcon2({
  style,
  size,
  strokeWidth = 2,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Ellipse cx="12" cy="11" rx="9" ry="9" />
      <Line x1="19" y1="17.3" x2="23.5" y2="21" strokeLinecap="round" />
    </Svg>
  )
}

export function MagnifyingGlassIcon2Solid({
  style,
  size,
  strokeWidth = 2,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Ellipse
        cx="12"
        cy="11"
        rx="7"
        ry="7"
        stroke="none"
        fill="currentColor"
      />
      <Ellipse cx="12" cy="11" rx="9" ry="9" />
      <Line x1="19" y1="17.3" x2="23.5" y2="21" strokeLinecap="round" />
    </Svg>
  )
}

// https://github.com/Remix-Design/RemixIcon/blob/master/License
export function BellIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 24}
      height={size || 24}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path d="M 11.642 2 H 12.442 A 8.6 8.55 0 0 1 21.042 10.55 V 18.1 A 1 1 0 0 1 20.042 19.1 H 4.042 A 1 1 0 0 1 3.042 18.1 V 10.55 A 8.6 8.55 0 0 1 11.642 2 Z" />
      <Line x1="9" y1="22" x2="15" y2="22" />
    </Svg>
  )
}

// https://github.com/Remix-Design/RemixIcon/blob/master/License
export function BellIconSolid({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      viewBox="0 0 24 24"
      width={size || 24}
      height={size || 24}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        d="M 11.642 2 H 12.442 A 8.6 8.55 0 0 1 21.042 10.55 V 18.1 A 1 1 0 0 1 20.042 19.1 H 4.042 A 1 1 0 0 1 3.042 18.1 V 10.55 A 8.6 8.55 0 0 1 11.642 2 Z"
        fill="currentColor"
      />
      <Line x1="9" y1="22" x2="15" y2="22" />
    </Svg>
  )
}

export function CogIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </Svg>
  )
}

export function CogIconSolid({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 9.594 3.94 C 9.684 3.398 10.154 3 10.704 3 L 13.297 3 C 13.847 3 14.317 3.398 14.407 3.94 L 14.62 5.221 C 14.683 5.595 14.933 5.907 15.265 6.091 C 15.339 6.131 15.412 6.174 15.485 6.218 C 15.809 6.414 16.205 6.475 16.56 6.342 L 17.777 5.886 C 18.292 5.692 18.872 5.9 19.147 6.376 L 20.443 8.623 C 20.718 9.099 20.608 9.705 20.183 10.054 L 19.18 10.881 C 18.887 11.121 18.742 11.494 18.749 11.873 C 18.751 11.958 18.751 12.043 18.749 12.128 C 18.742 12.506 18.887 12.878 19.179 13.118 L 20.184 13.946 C 20.608 14.296 20.718 14.9 20.444 15.376 L 19.146 17.623 C 18.871 18.099 18.292 18.307 17.777 18.114 L 16.56 17.658 C 16.205 17.525 15.81 17.586 15.484 17.782 C 15.412 17.826 15.338 17.869 15.264 17.91 C 14.933 18.093 14.683 18.405 14.62 18.779 L 14.407 20.059 C 14.317 20.602 13.847 21 13.297 21 L 10.703 21 C 10.153 21 9.683 20.602 9.593 20.06 L 9.38 18.779 C 9.318 18.405 9.068 18.093 8.736 17.909 C 8.662 17.868 8.589 17.826 8.516 17.782 C 8.191 17.586 7.796 17.525 7.44 17.658 L 6.223 18.114 C 5.708 18.307 5.129 18.1 4.854 17.624 L 3.557 15.377 C 3.282 14.901 3.392 14.295 3.817 13.946 L 4.821 13.119 C 5.113 12.879 5.258 12.506 5.251 12.127 C 5.249 12.042 5.249 11.957 5.251 11.872 C 5.258 11.494 5.113 11.122 4.821 10.882 L 3.817 10.054 C 3.393 9.705 3.283 9.1 3.557 8.624 L 4.854 6.377 C 5.129 5.9 5.709 5.692 6.224 5.886 L 7.44 6.342 C 7.796 6.475 8.191 6.414 8.516 6.218 C 8.588 6.174 8.662 6.131 8.736 6.09 C 9.068 5.907 9.318 5.595 9.38 5.221 Z M 13.5 9.402 C 11.5 8.247 9 9.691 9 12 C 9 13.072 9.572 14.062 10.5 14.598 C 12.5 15.753 15 14.309 15 12 C 15 10.928 14.428 9.938 13.5 9.402 Z"
        fill="currentColor"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function MoonIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function SunIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        d="M12 3V5.25M18.364 5.63604L16.773 7.22703M21 12H18.75M18.364 18.364L16.773 16.773M12 18.75V21M7.22703 16.773L5.63604 18.364M5.25 12H3M7.22703 7.22703L5.63604 5.63604M15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.25 14.0711 8.25 12C8.25 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function UserIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </Svg>
  )
}

export function UserIconSolid({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        d="M 15 9.75 C 15 12.059 12.5 13.503 10.5 12.348 C 9.572 11.812 9 10.822 9 9.75 C 9 7.441 11.5 5.997 13.5 7.152 C 14.428 7.688 15 8.678 15 9.75 Z"
      />
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        d="M 17.982 18.725 C 16.565 16.849 14.35 15.748 12 15.75 C 9.65 15.748 7.435 16.849 6.018 18.725 M 17.981 18.725 C 16.335 20.193 14.206 21.003 12 21 C 9.794 21.003 7.664 20.193 6.018 18.725"
      />
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 17.981 18.725 C 23.158 14.12 21.409 5.639 14.833 3.458 C 8.257 1.277 1.786 7.033 3.185 13.818 C 3.576 15.716 4.57 17.437 6.018 18.725 M 17.981 18.725 C 16.335 20.193 14.206 21.003 12 21 C 9.794 21.003 7.664 20.193 6.018 18.725"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function UserGroupIcon({
  style,
  size,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={2}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    </Svg>
  )
}

export function RepostIcon({
  style,
  size = 24,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <Path
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill="none"
        d="M 14.437 18.081 L 5.475 18.095 C 4.7 18.095 4.072 17.467 4.072 16.692 L 4.082 6.65 L 1.22 10.854 M 4.082 6.65 L 7.006 10.854 M 9.859 6.65 L 18.625 6.654 C 19.4 6.654 20.028 7.282 20.028 8.057 L 20.031 18.081 L 17.167 13.646 M 20.031 18.081 L 22.866 13.646"
      />
    </Svg>
  )
}

// Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc.
export function HeartIcon({
  style,
  size = 24,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <Path
        strokeWidth={strokeWidth}
        stroke="currentColor"
        fill="none"
        d="M 3.859 13.537 L 10.918 20.127 C 11.211 20.4 11.598 20.552 12 20.552 C 12.402 20.552 12.789 20.4 13.082 20.127 L 20.141 13.537 C 21.328 12.431 22 10.88 22 9.259 L 22 9.033 C 22 6.302 20.027 3.974 17.336 3.525 C 15.555 3.228 13.742 3.81 12.469 5.084 L 12 5.552 L 11.531 5.084 C 10.258 3.81 8.445 3.228 6.664 3.525 C 3.973 3.974 2 6.302 2 9.033 L 2 9.259 C 2 10.88 2.672 12.431 3.859 13.537 Z"
      />
    </Svg>
  )
}

// Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc.
export function HeartIconSolid({
  style,
  size = 24,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
}) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <Path
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1}
        d="M 3.859 13.537 L 10.918 20.127 C 11.211 20.4 11.598 20.552 12 20.552 C 12.402 20.552 12.789 20.4 13.082 20.127 L 20.141 13.537 C 21.328 12.431 22 10.88 22 9.259 L 22 9.033 C 22 6.302 20.027 3.974 17.336 3.525 C 15.555 3.228 13.742 3.81 12.469 5.084 L 12 5.552 L 11.531 5.084 C 10.258 3.81 8.445 3.228 6.664 3.525 C 3.973 3.974 2 6.302 2 9.033 L 2 9.259 C 2 10.88 2.672 12.431 3.859 13.537 Z"
      />
    </Svg>
  )
}

export function UpIcon({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg
      viewBox="0 0 14 14"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeWidth={strokeWidth}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 7 3 L 2 8 L 4.5 8 L 4.5 11.5 L 9.5 11.5 L 9.5 8 L 12 8 L 7 3 Z"
      />
    </Svg>
  )
}

export function UpIconSolid({
  style,
  size,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
}) {
  return (
    <Svg
      viewBox="0 0 14 14"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeWidth={1.3}
        stroke="currentColor"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 7 3 L 2 8 L 4.5 8 L 4.5 11.5 L 9.5 11.5 L 9.5 8 L 12 8 L 7 3 Z"
      />
    </Svg>
  )
}

export function DownIcon({
  style,
  size,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
}) {
  return (
    <Svg
      viewBox="0 0 14 14"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeWidth={1.3}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 7 11.5 L 2 6.5 L 4.5 6.5 L 4.5 3 L 9.5 3 L 9.5 6.5 L 12 6.5 L 7 11.5 Z"
      />
    </Svg>
  )
}

export function DownIconSolid({
  style,
  size,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
}) {
  return (
    <Svg
      viewBox="0 0 14 14"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeWidth={1.3}
        stroke="currentColor"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 7 11.5 L 2 6.5 L 4.5 6.5 L 4.5 3 L 9.5 3 L 9.5 6.5 L 12 6.5 L 7 11.5 Z"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function CommentBottomArrow({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  let color = 'currentColor'
  if (
    style &&
    typeof style === 'object' &&
    'color' in style &&
    typeof style.color === 'string'
  ) {
    color = style.color
  }
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 2.5}
      stroke={color}
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </Svg>
  )
}

export function SquareIcon({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 1}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Rect x="6" y="6" width="12" height="12" strokeLinejoin="round" />
    </Svg>
  )
}

export function RectWideIcon({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 1}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Rect x="4" y="6" width="16" height="12" strokeLinejoin="round" />
    </Svg>
  )
}

export function RectTallIcon({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 1}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Rect x="6" y="4" width="12" height="16" strokeLinejoin="round" />
    </Svg>
  )
}

export function ComposeIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </Svg>
  )
}

export function ComposeIcon2({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        d="M 20 9 L 20 16 C 20 18.209 18.209 20 16 20 L 8 20 C 5.791 20 4 18.209 4 16 L 4 8 C 4 5.791 5.791 4 8 4 L 15 4"
        strokeWidth={strokeWidth}
      />
      <Line
        strokeLinecap="round"
        x1="10"
        y1="14"
        x2="18.5"
        y2="5.5"
        strokeWidth={strokeWidth * 1.5}
      />
      <Line
        strokeLinecap="round"
        x1="20.5"
        y1="3.5"
        x2="21"
        y2="3"
        strokeWidth={strokeWidth * 1.5}
      />
    </Svg>
  )
}

export function SquarePlusIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Line
        strokeLinecap="round"
        strokeLinejoin="round"
        x1="12"
        y1="5.5"
        x2="12"
        y2="18.5"
        strokeWidth={strokeWidth * 1.5}
      />
      <Line
        strokeLinecap="round"
        strokeLinejoin="round"
        x1="5.5"
        y1="12"
        x2="18.5"
        y2="12"
        strokeWidth={strokeWidth * 1.5}
      />
      <Rect
        strokeWidth={strokeWidth}
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        ry="4"
      />
    </Svg>
  )
}

export function InfoCircleIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size}
      height={size}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </Svg>
  )
}

export function HandIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 76 76"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      fill="none"
      style={style}>
      <Path d="M33.5 37V11.5C33.5 8.46243 31.0376 6 28 6V6C24.9624 6 22.5 8.46243 22.5 11.5V48V48C22.5 48.5802 21.8139 48.8874 21.3811 48.501L13.2252 41.2189C10.72 38.9821 6.81945 39.4562 4.92296 42.228L4.77978 42.4372C3.17708 44.7796 3.50863 47.9385 5.56275 49.897L16.0965 59.9409C20.9825 64.5996 26.7533 68.231 33.0675 70.6201V70.6201C38.8234 72.798 45.1766 72.798 50.9325 70.6201L51.9256 70.2444C57.4044 68.1713 61.8038 63.9579 64.1113 58.5735V58.5735C65.6874 54.8962 66.5 50.937 66.5 46.9362V22.5C66.5 19.4624 64.0376 17 61 17V17C57.9624 17 55.5 19.4624 55.5 22.5V36.5" />
      <Path d="M55.5 37V11.5C55.5 8.46243 53.0376 6 50 6V6C46.9624 6 44.5 8.46243 44.5 11.5V37" />
      <Path d="M44.5 37V8.5C44.5 5.46243 42.0376 3 39 3V3C35.9624 3 33.5 5.46243 33.5 8.5V37" />
    </Svg>
  )
}

export function SatelliteDishIconSolid({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      width={size || 24}
      height={size || 24}
      viewBox="0 0 22 22"
      style={style}
      fill="none"
      stroke="none">
      <Path
        d="M16 19.6622C14.5291 20.513 12.8214 21 11 21C5.47715 21 1 16.5229 1 11C1 9.17858 1.48697 7.47088 2.33782 6.00002C3.18867 4.52915 6 7.66219 6 7.66219L14.5 16.1622C14.5 16.1622 17.4709 18.8113 16 19.6622Z"
        fill="currentColor"
      />
      <Path
        d="M8 1.62961C9.04899 1.22255 10.1847 1 11.3704 1C16.6887 1 21 5.47715 21 11C21 12.0452 20.8456 13.053 20.5592 14"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M9 5.38745C9.64553 5.13695 10.3444 5 11.0741 5C14.3469 5 17 7.75517 17 11.1538C17 11.797 16.905 12.4172 16.7287 13"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="10" cy="12" r="2" fill="currentColor" />
    </Svg>
  )
}

export function SatelliteDishIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 22 22"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size}
      height={size}
      style={style}>
      <Path d="M 12.705346,15.777547 C 14.4635,17.5315 14.7526,17.8509 14.9928,18.1812 c 0.2139,0.2943 0.3371,0.5275 0.3889,0.6822 C 14.0859,19.5872 12.5926,20 11,20 6.02944,20 2,15.9706 2,11 2,9.4151 2.40883,7.9285 3.12619,6.63699 3.304,6.69748 3.56745,6.84213 3.89275,7.08309 4.3705644,7.4380098 4.7486794,7.8160923 6.4999995,9.5689376 8.2513197,11.321783 10.947192,14.023595 12.705346,15.777547 Z" />
      <Path
        d="M8 1.62961C9.04899 1.22255 10.1847 1 11.3704 1C16.6887 1 21 5.47715 21 11C21 12.0452 20.8456 13.053 20.5592 14"
        strokeLinecap="round"
      />
      <Path
        d="M9 5.38745C9.64553 5.13695 10.3444 5 11.0741 5C14.3469 5 17 7.75517 17 11.1538C17 11.797 16.905 12.4172 16.7287 13"
        strokeLinecap="round"
      />
      <Path
        d="M12 12C12 12.7403 11.5978 13.3866 11 13.7324L8.26756 11C8.61337 10.4022 9.25972 10 10 10C11.1046 10 12 10.8954 12 12Z"
        fill="currentColor"
        stroke="none"
      />
    </Svg>
  )
}
