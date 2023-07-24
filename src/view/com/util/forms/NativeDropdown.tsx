import React from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import * as DropdownMenu from 'zeego/dropdown-menu'
import {StyleSheet, View} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {MenuItemCommonProps} from 'zeego/lib/typescript/menu'
export const DropdownMenuRoot = DropdownMenu.Root
export const DropdownMenuTrigger = DropdownMenu.Trigger
export const DropdownMenuContent = DropdownMenu.Content
type ItemProps = React.ComponentProps<(typeof DropdownMenu)['Item']>
export const DropdownMenuItem = DropdownMenu.create((props: ItemProps) => {
  return <DropdownMenu.Item {...props} />
}, 'Item')
type TitleProps = React.ComponentProps<(typeof DropdownMenu)['ItemTitle']>
export const DropdownMenuItemTitle = DropdownMenu.create(
  (props: TitleProps) => {
    return <DropdownMenu.ItemTitle {...props} />
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
    return (
      <DropdownMenu.Separator
        {...props}
        style={[props.style, styles.separator]}
      />
    )
  },
  'Separator',
)

export type DropdownItem = {
  label: string | 'separator'
  onPress?: () => void
  testId?: string
  icon?: {
    ios: MenuItemCommonProps['ios']
    android: string
    web: IconProp
  }
}
type Props = {
  items: DropdownItem[]
}

export function NativeDropdown({items}: Props) {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger style={{}} action="press">
        <View hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
          <FontAwesomeIcon icon="ellipsis" size={20} />
        </View>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item, index) => {
          return (
            <DropdownMenuItem
              key={item.testId ? item.testId : `${item.label}_${index}`}
              onSelect={item.onPress}>
              <DropdownMenuItemTitle>{item.label}</DropdownMenuItemTitle>
              {item.icon && (
                <DropdownMenuItemIcon
                  ios={item.icon.ios}
                  androidIconName={item.icon.android}>
                  <FontAwesomeIcon icon={item.icon.web} size={20} />
                </DropdownMenuItemIcon>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  )
}

export const ExampleDropdown = () => (
  <NativeDropdown
    items={[
      {
        label: 'Click me!',
        onPress: () => {
          console.log('Clicked Dropdown')
        },
      },
    ]}
  />
)

const styles = StyleSheet.create({
  separator: {
    backgroundColor: 'rgb(215, 207, 249)',
    height: 1,
    margin: 6,
  },
})
