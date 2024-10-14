import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import * as Button from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {Link, LinkProps} from '#/components/Link'

export function LinkItem({style, children, ...props}: LinkProps) {
  const t = useTheme()
  return (
    <Link color="secondary" {...props}>
      {args => (
        <View
          style={[
            a.px_xl,
            a.py_sm,
            a.align_center,
            a.gap_md,
            a.flex_1,
            a.flex_row,
            {minHeight: 48},
            (args.hovered || args.pressed) && [t.atoms.bg_contrast_25],
            style,
          ]}>
          {typeof children === 'function' ? children(args) : children}
          <View style={[a.flex_1]} />
          <ItemIcon
            icon={ChevronRightIcon}
            size="md"
            color={t.palette.contrast_500}
          />
        </View>
      )}
    </Link>
  )
}

export function ItemIcon({
  icon: Comp,
  size = 'xl',

  color,
}: Omit<React.ComponentProps<typeof Button.ButtonIcon>, 'position'> & {
  color?: string
}) {
  const t = useTheme()

  /*
   * Copied here from icons/common.tsx so we can tweak if we need to, but
   * also so that we can calculate transforms.
   */
  const iconSize = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    '2xl': 32,
  }[size]

  return (
    <View style={[a.z_20, {width: iconSize, height: iconSize}]}>
      <Comp width={iconSize} style={[color ? {color} : t.atoms.text]} />
    </View>
  )
}

export function ItemText({
  // eslint-disable-next-line react/prop-types
  style,
  ...props
}: React.ComponentProps<typeof Button.ButtonText>) {
  return (
    <Button.ButtonText
      style={[a.text_md, a.font_normal, a.text_left, style]}
      {...props}
    />
  )
}
