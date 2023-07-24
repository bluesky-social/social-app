import React from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import * as DropdownMenu from 'zeego/dropdown-menu'
import {View} from 'react-native'
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

type DropdownItem = {
  label: string
  onPress: () => void
}
type Props = {
  items: DropdownItem[]
}

export function NativeDropdown({items}: Props) {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger style={{}}>
        <View hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <FontAwesomeIcon icon="ellipsis" size={20} />
        </View>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item, index) => (
          <DropdownMenuItem
            key={`${item.label}_${index}`}
            onSelect={item.onPress}>
            <DropdownMenuItemTitle>{item.label}</DropdownMenuItemTitle>
          </DropdownMenuItem>
        ))}
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
