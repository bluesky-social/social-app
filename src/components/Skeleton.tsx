import {type ReactNode} from 'react'
import {View} from 'react-native'

import {
  atoms as a,
  flatten,
  type TextStyleProp,
  useAlf,
  useTheme,
  type ViewStyleProp,
} from '#/alf'
import {normalizeTextStyles} from '#/alf/typography'

type SkeletonProps = {
  blend?: boolean
}

export function Text({blend, style}: TextStyleProp & SkeletonProps) {
  const {fonts, flags, theme: t} = useAlf()
  const {width, ...flattened} = flatten(style)
  const {lineHeight = 14, ...rest} = normalizeTextStyles(
    [a.text_sm, a.leading_snug, flattened],
    {
      fontScale: fonts.scaleMultiplier,
      fontFamily: fonts.family,
      flags,
    },
  )
  return (
    <View
      style={[a.flex_1, {maxWidth: width, paddingVertical: lineHeight * 0.15}]}>
      <View
        style={[
          a.rounded_md,
          t.atoms.bg_contrast_25,
          {
            height: lineHeight * 0.7,
            opacity: blend ? 0.6 : 1,
          },
          rest,
        ]}
      />
    </View>
  )
}

export function Circle({
  children,
  size,
  blend,
  style,
}: ViewStyleProp & {children?: ReactNode; size: number} & SkeletonProps) {
  const t = useTheme()
  return (
    <View
      style={[
        a.justify_center,
        a.align_center,
        a.rounded_full,
        t.atoms.bg_contrast_25,
        {
          width: size,
          height: size,
          opacity: blend ? 0.6 : 1,
        },
        style,
      ]}>
      {children}
    </View>
  )
}

export function Pill({
  size,
  blend,
  style,
}: ViewStyleProp & {size: number} & SkeletonProps) {
  const t = useTheme()
  return (
    <View
      style={[
        a.rounded_full,
        t.atoms.bg_contrast_25,
        {
          width: size * 1.618,
          height: size,
          opacity: blend ? 0.6 : 1,
        },
        style,
      ]}
    />
  )
}

export function Col({
  children,
  style,
}: ViewStyleProp & {children?: React.ReactNode}) {
  return <View style={[a.flex_1, style]}>{children}</View>
}

export function Row({
  children,
  style,
}: ViewStyleProp & {children?: React.ReactNode}) {
  return <View style={[a.flex_row, style]}>{children}</View>
}
