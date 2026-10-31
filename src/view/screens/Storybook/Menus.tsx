import {useState} from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
// import {useDialogStateControlContext} from '#/state/dialogs'

export function Menus() {
  const t = useTheme()
  const menuControl = Menu.useMenuControl()
  const [sort, setSort] = useState<'top' | 'oldest' | 'newest'>('top')
  // const {closeAllDialogs} = useDialogStateControlContext()

  return (
    <View style={[a.gap_md]}>
      <View style={[a.flex_row, a.align_start]}>
        <Menu.Root control={menuControl}>
          <Menu.Trigger label="Open basic menu">
            {({state, props}) => {
              return (
                <Text
                  {...props}
                  style={[
                    a.py_sm,
                    a.px_md,
                    a.rounded_sm,
                    t.atoms.bg_contrast_50,
                    (state.hovered || state.focused || state.pressed) && [
                      t.atoms.bg_contrast_200,
                    ],
                  ]}>
                  Open
                </Text>
              )
            }}
          </Menu.Trigger>

          <Menu.Outer>
            <Menu.Group>
              <Menu.Item label="Click me" onPress={() => {}}>
                <Menu.ItemIcon icon={Search} />
                <Menu.ItemText>Click me</Menu.ItemText>
              </Menu.Item>

              <Menu.Item
                label="Another item"
                onPress={() => menuControl.close()}>
                <Menu.ItemText>Another item</Menu.ItemText>
              </Menu.Item>
            </Menu.Group>

            <Menu.Divider />

            <Menu.Group>
              <Menu.Item label="Click me" onPress={() => {}}>
                <Menu.ItemIcon icon={Search} />
                <Menu.ItemText>Click me</Menu.ItemText>
              </Menu.Item>

              <Menu.Item
                label="Another item"
                onPress={() => menuControl.close()}>
                <Menu.ItemText>Another item</Menu.ItemText>
              </Menu.Item>
            </Menu.Group>

            <Menu.Divider />

            <Menu.Item label="Click me" onPress={() => {}}>
              <Menu.ItemIcon icon={Search} />
              <Menu.ItemText>Click me</Menu.ItemText>
            </Menu.Item>
          </Menu.Outer>
        </Menu.Root>
      </View>

      <View style={[a.flex_row, a.align_start]}>
        <Menu.Root inline>
          <Menu.Trigger label="Open inline menu">
            {({state, props}) => {
              return (
                <Text
                  {...props}
                  style={[
                    a.py_sm,
                    a.px_md,
                    a.rounded_sm,
                    t.atoms.bg_contrast_50,
                    (state.hovered || state.focused || state.pressed) && [
                      t.atoms.bg_contrast_200,
                    ],
                  ]}>
                  Open inline
                </Text>
              )
            }}
          </Menu.Trigger>

          <Menu.Outer>
            <Menu.Group>
              <Menu.Item label="Search" onPress={() => {}}>
                <Menu.ItemText>Search</Menu.ItemText>
                <Menu.ItemIcon icon={Search} position="right" />
              </Menu.Item>
              <Menu.Item label="Disabled" onPress={() => {}} disabled>
                <Menu.ItemText>Disabled</Menu.ItemText>
              </Menu.Item>
            </Menu.Group>

            <Menu.Divider />

            <Menu.LabelText>Reply sorting</Menu.LabelText>
            <Menu.Group>
              {(['top', 'oldest', 'newest'] as const).map(value => (
                <Menu.Item
                  key={value}
                  label={value}
                  onPress={() => setSort(value)}>
                  <Menu.ItemText>{value}</Menu.ItemText>
                  <Menu.ItemRadio selected={sort === value} />
                </Menu.Item>
              ))}
            </Menu.Group>

            <Menu.Divider />

            <Menu.Item label="Delete" onPress={() => {}} destructive>
              <Menu.ItemText>Delete</Menu.ItemText>
              <Menu.ItemIcon icon={Trash} position="right" />
            </Menu.Item>
          </Menu.Outer>
        </Menu.Root>
      </View>
    </View>
  )
}
