import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import * as Menu from '#/components/Menu'
// import {useDialogStateControlContext} from '#/state/dialogs'

export function Menus() {
  // const {closeAllDialogs} = useDialogStateControlContext()

  return (
    <View style={[a.gap_md]}>
      <Menu.Root>
        <Menu.Trigger>
          {({state, handlers}) => {
            console.log(state.hovered, state.focused, state.pressed)
            return <Text {...handlers}>Open</Text>
          }}
        </Menu.Trigger>

        <Menu.Outer>
          <Text>Open</Text>
        </Menu.Outer>
      </Menu.Root>
    </View>
  )
}
