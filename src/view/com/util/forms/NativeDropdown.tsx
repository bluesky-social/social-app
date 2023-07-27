import React from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import * as DropdownMenu from 'zeego/dropdown-menu'
import {
  Pressable,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {MenuItemCommonProps} from 'zeego/lib/typescript/menu'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {useTheme} from 'lib/ThemeContext'
import {HITSLOP_10} from 'lib/constants'

// Custom Dropdown Menu Components
// ==
export const DropdownMenuRoot = DropdownMenu.Root
export const DropdownMenuTrigger = DropdownMenu.Trigger
export const DropdownMenuContent = DropdownMenu.Content
type ItemProps = React.ComponentProps<(typeof DropdownMenu)['Item']>
export const DropdownMenuItem = DropdownMenu.create(
  (props: ItemProps & {testID?: string}) => {
    const pal = usePalette('default')
    const theme = useTheme()
    const [focused, setFocused] = React.useState(false)
    const {borderColor: backgroundColor} =
      theme.colorScheme === 'dark' ? pal.borderDark : pal.border

    return (
      <DropdownMenu.Item
        {...props}
        style={[styles.item, focused && {backgroundColor: backgroundColor}]}
        onFocus={() => {
          setFocused(true)
          props.onFocus && props.onFocus()
        }}
        onBlur={() => {
          setFocused(false)
          props.onBlur && props.onBlur()
        }}
      />
    )
  },
  'Item',
)
type TitleProps = React.ComponentProps<(typeof DropdownMenu)['ItemTitle']>
export const DropdownMenuItemTitle = DropdownMenu.create(
  (props: TitleProps) => {
    const pal = usePalette('default')
    return (
      <DropdownMenu.ItemTitle
        {...props}
        style={[props.style, pal.text, styles.itemTitle]}
      />
    )
  },
  'ItemTitle',
)
type IconProps = React.ComponentProps<(typeof DropdownMenu)['ItemIcon']>
export const DropdownMenuItemIcon = DropdownMenu.create((props: IconProps) => {
  return <DropdownMenu.ItemIcon {...props} />
}, 'ItemIcon')
type SeparatorProps = React.ComponentProps<(typeof DropdownMenu)['Separator']>
export const DropdownMenuSeparator = DropdownMenu.create(
  (props: SeparatorProps) => {
    const pal = usePalette('default')
    const theme = useTheme()
    const {borderColor: separatorColor} =
      theme.colorScheme === 'dark' ? pal.borderDark : pal.border
    return (
      <DropdownMenu.Separator
        {...props}
        style={[
          props.style,
          styles.separator,
          {backgroundColor: separatorColor},
        ]}
      />
    )
  },
  'Separator',
)

// Types for Dropdown Menu and Items
export type DropdownItem = {
  label: string | 'separator'
  onPress?: () => void
  testID?: string
  icon?: {
    ios: MenuItemCommonProps['ios']
    android: string
    web: IconProp
  }
}
type Props = {
  items: DropdownItem[]
  children?: React.ReactNode
  testID?: string
}

/* The `NativeDropdown` function uses native iOS and Android dropdown menus.
 * It also creates a animated custom dropdown for web that uses
 * Radix UI primitives under the hood
 * @prop {DropdownItem[]} items - An array of dropdown items
 * @prop {React.ReactNode} children - A custom dropdown trigger
 */
export function NativeDropdown({items, children, testID}: Props) {
  const pal = usePalette('default')
  const theme = useTheme()
  const dropDownBackgroundColor =
    theme.colorScheme === 'dark' ? pal.btn : pal.viewLight
  const defaultCtrlColor = React.useMemo(
    () => ({
      color: theme.palette.default.postCtrl,
    }),
    [theme],
  ) as StyleProp<ViewStyle>

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger action="press">
        <Pressable
          testID={testID}
          accessibilityRole="button"
          style={({pressed}) => [{opacity: pressed ? 0.5 : 1}]}
          hitSlop={HITSLOP_10}>
          {children ? (
            children
          ) : (
            <FontAwesomeIcon
              icon="ellipsis"
              size={20}
              style={[defaultCtrlColor, styles.ellipsis]}
            />
          )}
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        style={[styles.content, dropDownBackgroundColor]}
        loop>
        {items.map((item, index) => {
          if (item.label === 'separator') {
            return (
              <DropdownMenuSeparator
                key={getKey(item.label, index, item.testID)}
              />
            )
          }
          if (index > 1 && items[index - 1].label === 'separator') {
            return (
              <DropdownMenu.Group key={getKey(item.label, index, item.testID)}>
                <DropdownMenuItem
                  key={getKey(item.label, index, item.testID)}
                  onSelect={item.onPress}>
                  <DropdownMenuItemTitle>{item.label}</DropdownMenuItemTitle>
                  {item.icon && (
                    <DropdownMenuItemIcon
                      ios={item.icon.ios}
                      // androidIconName={item.icon.android} TODO: Add custom android icon support, because these ones are based on https://developer.android.com/reference/android/R.drawable.html and they are ugly
                    >
                      <FontAwesomeIcon
                        icon={item.icon.web}
                        size={20}
                        style={[pal.text]}
                      />
                    </DropdownMenuItemIcon>
                  )}
                </DropdownMenuItem>
              </DropdownMenu.Group>
            )
          }
          return (
            <DropdownMenuItem
              key={getKey(item.label, index, item.testID)}
              onSelect={item.onPress}>
              <DropdownMenuItemTitle>{item.label}</DropdownMenuItemTitle>
              {item.icon && (
                <DropdownMenuItemIcon
                  ios={item.icon.ios}
                  // androidIconName={item.icon.android}
                >
                  <FontAwesomeIcon
                    icon={item.icon.web}
                    size={20}
                    style={[pal.text]}
                  />
                </DropdownMenuItemIcon>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  )
}

const getKey = (label: string, index: number, id?: string) => {
  if (id) {
    return id
  }
  return `${label}_${index}`
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    marginVertical: 4,
  },
  ellipsis: {
    padding: isWeb ? 0 : 10,
  },
  content: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginTop: 6,
    ...Platform.select({
      web: {
        animationDuration: '400ms',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform, opacity',
        animationKeyframes: {
          '0%': {opacity: 0, transform: [{scale: 0.5}]},
          '100%': {opacity: 1, transform: [{scale: 1}]},
        },
        boxShadow:
          '0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)',
        transformOrigin: 'var(--radix-dropdown-menu-content-transform-origin)',
      },
    }),
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 20,
    // @ts-ignore -web
    cursor: 'pointer',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: 18,
  },
})
