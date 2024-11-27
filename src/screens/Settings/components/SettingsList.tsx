import React, {useContext, useMemo} from 'react'
import {GestureResponderEvent, StyleProp, View, ViewStyle} from 'react-native'

import {HITSLOP_10} from '#/lib/constants'
import {atoms as a, useTheme, ViewStyleProp} from '#/alf'
import * as Button from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {Link, LinkProps} from '#/components/Link'
import {createPortalGroup} from '#/components/Portal'
import {Text} from '#/components/Typography'

const ItemContext = React.createContext({
  destructive: false,
  withinGroup: false,
})

const Portal = createPortalGroup()

export function Container({children}: {children: React.ReactNode}) {
  return <View style={[a.flex_1, a.py_md]}>{children}</View>
}

/**
 * This uses `Portal` magic ✨ to render the icons and title correctly. ItemIcon and ItemText components
 * get teleported to the top row, leaving the rest of the children in the bottom row.
 */
export function Group({
  children,
  destructive = false,
  iconInset = true,
  style,
  contentContainerStyle,
}: {
  children: React.ReactNode
  destructive?: boolean
  iconInset?: boolean
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}) {
  const context = useMemo(
    () => ({destructive, withinGroup: true}),
    [destructive],
  )
  return (
    <View style={[a.w_full, style]}>
      <Portal.Provider>
        <ItemContext.Provider value={context}>
          <Item style={[a.pb_2xs, {minHeight: 42}]}>
            <Portal.Outlet />
          </Item>
          <Item
            style={[
              a.flex_col,
              a.pt_2xs,
              a.align_start,
              a.gap_0,
              contentContainerStyle,
            ]}
            iconInset={iconInset}>
            {children}
          </Item>
        </ItemContext.Provider>
      </Portal.Provider>
    </View>
  )
}

export function Item({
  children,
  destructive,
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
  const context = useContext(ItemContext)
  const childContext = useMemo(() => {
    if (typeof destructive !== 'boolean') return context
    return {...context, destructive}
  }, [context, destructive])
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
      <ItemContext.Provider value={childContext}>
        {children}
      </ItemContext.Provider>
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
  const {destructive, withinGroup} = useContext(ItemContext)

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

  const content = (
    <View style={[a.z_20, {width: iconSize, height: iconSize}]}>
      <Comp width={iconSize} style={[{color}]} />
    </View>
  )

  if (withinGroup) {
    return <Portal.Portal>{content}</Portal.Portal>
  } else {
    return content
  }
}

export function ItemText({
  style,
  ...props
}: React.ComponentProps<typeof Button.ButtonText>) {
  const t = useTheme()
  const {destructive, withinGroup} = useContext(ItemContext)

  const content = (
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

  if (withinGroup) {
    return <Portal.Portal>{content}</Portal.Portal>
  } else {
    return content
  }
}

export function Divider({style}: ViewStyleProp) {
  const t = useTheme()
  return (
    <View
      style={[
        a.border_t,
        t.atoms.border_contrast_medium,
        a.w_full,
        a.my_sm,
        style,
      ]}
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

export function BadgeText({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  return (
    <Text
      style={[
        t.atoms.text_contrast_low,
        a.text_md,
        a.text_right,
        a.leading_snug,
        style,
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
