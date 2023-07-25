import React from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import * as DropdownMenu from 'zeego/dropdown-menu'
import {Pressable, StyleSheet} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {MenuItemCommonProps} from 'zeego/lib/typescript/menu'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {useTheme} from 'lib/ThemeContext'
export const DropdownMenuRoot = DropdownMenu.Root
export const DropdownMenuTrigger = DropdownMenu.Trigger
export const DropdownMenuContent = DropdownMenu.Content
type ItemProps = React.ComponentProps<(typeof DropdownMenu)['Item']>
export const DropdownMenuItem = DropdownMenu.create((props: ItemProps) => {
  return <DropdownMenu.Item {...props} style={[styles.item]} />
}, 'Item')
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
}
const HITSLOP = {top: 10, left: 10, bottom: 10, right: 10}

export function NativeDropdown({items, children}: Props) {
  const pal = usePalette('default')
  const theme = useTheme()
  const dropDownBackgroundColor =
    theme.colorScheme === 'dark' ? pal.btn : pal.viewLight

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger action="press">
        <Pressable accessibilityRole="button" hitSlop={HITSLOP}>
          {children ? (
            children
          ) : (
            <FontAwesomeIcon
              icon="ellipsis"
              size={20}
              style={[pal.textLight, styles.ellipsis]}
            />
          )}
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent style={[styles.content, dropDownBackgroundColor]}>
        {items.map((item, index) => {
          if (item.label === 'separator') {
            return (
              <DropdownMenuSeparator
                key={item.testID ? item.testID : `${item.label}_${index}`}
              />
            )
          }
          if (index > 1 && items[index - 1].label === 'separator') {
            return (
              <DropdownMenu.Group key={item.testID}>
                <DropdownMenuItem
                  key={item.testID ? item.testID : `${item.label}_${index}`}
                  onSelect={item.onPress}>
                  <DropdownMenuItemTitle>{item.label}</DropdownMenuItemTitle>
                  {item.icon && (
                    <DropdownMenuItemIcon
                      ios={item.icon.ios}
                      androidIconName={item.icon.android}>
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
              key={item.testID ? item.testID : `${item.label}_${index}`}
              onSelect={item.onPress}>
              <DropdownMenuItemTitle>{item.label}</DropdownMenuItemTitle>
              {item.icon && (
                <DropdownMenuItemIcon
                  ios={item.icon.ios}
                  androidIconName={item.icon.android}>
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
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: 6,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 20,
    // @ts-ignore -web
    cursor: 'pointer',
    paddingVertical: 8,
  },
  itemTitle: {
    fontSize: 18,
  },
})
