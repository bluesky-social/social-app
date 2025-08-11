import {Pressable, View} from 'react-native'

import {show as deprecatedShow} from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {toast} from '#/components/Toast'
import {Toast} from '#/components/Toast/Toast'
import {H1} from '#/components/Typography'

export function Toasts() {
  return (
    <View style={[a.gap_md]}>
      <H1>Toast Examples</H1>

      <View style={[a.gap_md]}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show({
              type: 'default',
              content: 'Default toast',
              a11yLabel: 'Default toast',
            })
          }>
          <Toast content="Default toast" type="default" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show({
              type: 'default',
              content: 'Default toast, 6 seconds',
              a11yLabel: 'Default toast, 6 seconds',
              duration: 6e3,
            })
          }>
          <Toast content="Default toast, 6 seconds" type="default" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show({
              type: 'default',
              content:
                'This is a longer message to test how the toast handles multiple lines of text content.',
              a11yLabel:
                'This is a longer message to test how the toast handles multiple lines of text content.',
            })
          }>
          <Toast
            content="This is a longer message to test how the toast handles multiple lines of text content."
            type="default"
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show({
              type: 'success',
              content: 'Success toast',
              a11yLabel: 'Success toast',
            })
          }>
          <Toast content="Success toast" type="success" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show({
              type: 'info',
              content: 'Info toast',
              a11yLabel: 'Info toast',
            })
          }>
          <Toast content="Info" type="info" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show({
              type: 'warning',
              content: 'Warning toast',
              a11yLabel: 'Warning toast',
            })
          }>
          <Toast content="Warning" type="warning" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            toast.show({
              type: 'error',
              content: 'Error toast',
              a11yLabel: 'Error toast',
            })
          }>
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
