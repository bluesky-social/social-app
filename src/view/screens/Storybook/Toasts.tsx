import {Pressable, View} from 'react-native'

import {show as deprecatedShow} from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import * as toast from '#/components/Toast'
import {Toast} from '#/components/Toast/Toast'
import {H1} from '#/components/Typography'

export function Toasts() {
  return (
    <View style={[a.gap_md]}>
      <H1>Toast Examples</H1>

      <View style={[a.gap_md]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => toast.show(`Hey I'm a toast!`)}>
          <Toast content="Hey I'm a toast!" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show(`This toast will disappear after 6 seconds`, {
              duration: 6e3,
            })
          }>
          <Toast content="This toast will disappear after 6 seconds" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show(
              `This is a longer message to test how the toast handles multiple lines of text content.`,
            )
          }>
          <Toast content="This is a longer message to test how the toast handles multiple lines of text content." />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show(`Success! Yayyyyyyy :)`, {
              type: 'success',
            })
          }>
          <Toast content="Success! Yayyyyyyy :)" type="success" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show(`I'm providing info!`, {
              type: 'info',
            })
          }>
          <Toast content="I'm providing info!" type="info" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show(`This is a warning toast`, {
              type: 'warning',
            })
          }>
          <Toast content="This is a warning toast" type="warning" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show(`This is an error toast :(`, {
              type: 'error',
            })
          }>
          <Toast content="This is an error toast :(" type="error" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            deprecatedShow(
              `This is a test of the deprecated API`,
              'exclamation-circle',
            )
          }>
          <Toast
            content="This is a test of the deprecated API"
            type="warning"
          />
        </Pressable>
      </View>
    </View>
  )
}
