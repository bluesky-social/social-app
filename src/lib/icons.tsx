import React from 'react'
import {StyleProp, TextStyle, ViewStyle} from 'react-native'
import Svg, {Ellipse, Line, Path, Rect} from 'react-native-svg'

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
      <Ellipse cx="12" cy="10.5" rx="9" ry="9" />
      <Line x1="18.5" y1="17" x2="22" y2="20.5" strokeLinecap="round" />
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

export function HashtagIcon({
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
      stroke="currentColor"
      viewBox="0 0 30 30"
      strokeWidth={strokeWidth}
      width={size}
      height={size}
      style={style}>
      <Path d="M2 10H28" strokeLinecap="round" />
      <Path d="M2 20H28" strokeLinecap="round" />
      <Path d="M11 3L9 27" strokeLinecap="round" />
      <Path d="M21 3L19 27" strokeLinecap="round" />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function ShieldExclamation({
  style,
  size,
  strokeWidth = 1.5,
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
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 1.5}
      stroke={color}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
      />
    </Svg>
  )
}
