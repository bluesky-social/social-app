import {Pressable, View} from 'react-native'

import {show as deprecatedShow} from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {show} from '#/components/Toast'
import {Toast} from '#/components/Toast/Toast'
import {H1} from '#/components/Typography'

export function Toasts() {
  return (
    <View style={[a.gap_md]}>
      <H1>Toast Examples</H1>

      <View style={[a.gap_md]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => show('Default toast', 'default')}>
          <Toast content="Default toast" type="default" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            show(
              'This is a longer message to test how the toast handles multiple lines of text content.',
              'default',
            )
          }>
          <Toast
            content="This is a longer message to test how the toast handles multiple lines of text content."
            type="default"
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => show('Success toast', 'success')}>
          <Toast content="Success toast" type="success" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => show('Info toast', 'info')}>
          <Toast content="Info" type="info" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => show('Warning toast', 'warning')}>
          <Toast content="Warning" type="warning" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => show('Error toast', 'error')}>
          <Toast content="Error" type="error" />
        </Pressable>

        <Button
          label="Deprecated toast example"
          onPress={() =>
            deprecatedShow(
              'This is a deprecated toast example',
              'exclamation-circle',
            )
          }
          size="large"
          variant="solid"
          color="secondary">
          <ButtonText>Deprecated toast example</ButtonText>
        </Button>
      </View>
    </View>
  )
}
