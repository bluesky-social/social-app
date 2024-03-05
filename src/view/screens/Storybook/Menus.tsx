import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import * as Menu from '#/components/Menu'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
// import {useDialogStateControlContext} from '#/state/dialogs'

export function Menus() {
  // const {closeAllDialogs} = useDialogStateControlContext()

  return (
    <View style={[a.gap_md]}>
      <View style={[a.flex_row, a.align_start]}>
        <Menu.Root>
          <Menu.Trigger style={[a.flex_1]}>
            {({handlers}) => {
              return <Text {...handlers}>Open</Text>
            }}
          </Menu.Trigger>

          <Menu.Outer>
            <Menu.Group>
              <Menu.Item label="Click me" onPress={() => {}}>
                <Menu.ItemIcon icon={Search} />
                <Menu.ItemText>Click me</Menu.ItemText>
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item label="Another item" onPress={() => {}}>
                <Menu.ItemText>Another item</Menu.ItemText>
              </Menu.Item>
            </Menu.Group>
          </Menu.Outer>
        </Menu.Root>
      </View>
    </View>
  )
}
