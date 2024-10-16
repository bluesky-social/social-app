import React, {useContext, useMemo} from 'react'
import {GestureResponderEvent, StyleProp, View, ViewStyle} from 'react-native'

import {HITSLOP_10} from '#/lib/constants'
import {atoms as a, useTheme} from '#/alf'
import * as Button from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {Link, LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'

const ItemContext = React.createContext({destructive: false})

export function Container({children}: {children: React.ReactNode}) {
  return <View style={[a.flex_1, a.py_lg]}>{children}</View>
}

export function Item({
  children,
  destructive = false,
  iconInset = false,
  style,
}: {
  children?: React.ReactNode
  destructive?: boolean
  /**
   * Adds left padding so that the content will be aligned with other Items that contain icons
   * @default false
   */
  iconInset?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const context = useMemo(() => ({destructive}), [destructive])
  return (
    <View
      style={[
        a.px_xl,
        a.py_sm,
        a.align_center,
        a.gap_md,
        a.w_full,
        a.flex_row,
        {minHeight: 48},
        iconInset && {
          paddingLeft:
            // existing padding
            a.pl_xl.paddingLeft +
            // icon
            28 +
            // gap
            a.gap_md.gap,
        },
        style,
      ]}>
      <ItemContext.Provider value={context}>{children}</ItemContext.Provider>
    </View>
  )
}

export function LinkItem({
  children,
  destructive = false,
  contentContainerStyle,
  chevronColor,
  ...props
}: LinkProps & {
  contentContainerStyle?: StyleProp<ViewStyle>
  destructive?: boolean
  chevronColor?: string
}) {
  const t = useTheme()

  return (
    <Link color="secondary" {...props}>
      {args => (
        <Item
          destructive={destructive}
          style={[
            (args.hovered || args.pressed) && [t.atoms.bg_contrast_25],
            contentContainerStyle,
          ]}>
          {typeof children === 'function' ? children(args) : children}
          <Chevron color={chevronColor} />
        </Item>
      )}
    </Link>
  )
}

export function PressableItem({
  children,
  destructive = false,
  contentContainerStyle,
  hoverStyle,
  ...props
}: Button.ButtonProps & {
  contentContainerStyle?: StyleProp<ViewStyle>
  destructive?: boolean
}) {
  const t = useTheme()
  return (
    <Button.Button {...props}>
      {args => (
        <Item
          destructive={destructive}
          style={[
            (args.hovered || args.pressed) && [
              t.atoms.bg_contrast_25,
              hoverStyle,
            ],
            contentContainerStyle,
          ]}>
          {typeof children === 'function' ? children(args) : children}
        </Item>
      )}
    </Button.Button>
  )
}

export function ItemIcon({
  icon: Comp,
  size = 'xl',
  color: colorProp,
}: Omit<React.ComponentProps<typeof Button.ButtonIcon>, 'position'> & {
  color?: string
}) {
  const t = useTheme()
  const {destructive} = useContext(ItemContext)

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

  const color =
    colorProp ?? (destructive ? t.palette.negative_500 : t.atoms.text.color)

  return (
    <View style={[a.z_20, {width: iconSize, height: iconSize}]}>
      <Comp width={iconSize} style={[{color}]} />
    </View>
  )
}

export function ItemText({
  // eslint-disable-next-line react/prop-types
  style,
  ...props
}: React.ComponentProps<typeof Button.ButtonText>) {
  const t = useTheme()
  const {destructive} = useContext(ItemContext)

  return (
    <Button.ButtonText
      style={[
        a.text_md,
        a.font_normal,
        a.text_left,
        a.flex_1,
        destructive ? {color: t.palette.negative_500} : t.atoms.text,
        style,
      ]}
      {...props}
    />
  )
}

export function Divider() {
  const t = useTheme()
  return (
    <View
      style={[a.border_t, t.atoms.border_contrast_medium, a.w_full, a.my_sm]}
    />
  )
}

export function Chevron({color: colorProp}: {color?: string}) {
  const {destructive} = useContext(ItemContext)
  const t = useTheme()
  const color =
    colorProp ?? (destructive ? t.palette.negative_500 : t.palette.contrast_500)
  return <ItemIcon icon={ChevronRightIcon} size="md" color={color} />
}

export function BadgeText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <Text
      style={[
        t.atoms.text_contrast_low,
        a.text_md,
        a.text_right,
        a.leading_snug,
      ]}
      numberOfLines={1}>
      {children}
    </Text>
  )
}

export function BadgeButton({
  label,
  onPress,
}: {
  label: string
  onPress: (evt: GestureResponderEvent) => void
}) {
  const t = useTheme()
  return (
    <Button.Button label={label} onPress={onPress} hitSlop={HITSLOP_10}>
      {({pressed}) => (
        <Button.ButtonText
          style={[
            a.text_md,
            a.font_normal,
            a.text_right,
            {color: pressed ? t.palette.contrast_300 : t.palette.primary_500},
          ]}>
          {label}
        </Button.ButtonText>
      )}
    </Button.Button>
  )
}
