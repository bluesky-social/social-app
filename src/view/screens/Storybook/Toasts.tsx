import {Pressable, View} from 'react-native'

import {show as deprecatedShow} from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import * as Toast from '#/components/Toast'
import {H1} from '#/components/Typography'

function DefaultToast({
  content,
  type = 'default',
}: {
  content: string
  type?: Toast.ToastType
}) {
  return (
    <Toast.ToastConfigProvider id="default-toast" type={type}>
      <Toast.Outer>
        <Toast.Icon icon={GlobeIcon} />
        <Toast.Text>{content}</Toast.Text>
      </Toast.Outer>
    </Toast.ToastConfigProvider>
  )
}

function ToastWithAction() {
  return (
    <Toast.Outer>
      <Toast.Icon icon={GlobeIcon} />
      <Toast.Text>This toast has an action button</Toast.Text>
      <Toast.Action
        label="Action"
        onPress={() => console.log('Action clicked!')}>
        Action
      </Toast.Action>
    </Toast.Outer>
  )
}

function LongToastWithAction() {
  return (
    <Toast.Outer>
      <Toast.Icon icon={GlobeIcon} />
      <Toast.Text>
        This is a longer message to test how the toast handles multiple lines of
        text content.
      </Toast.Text>
      <Toast.Action
        label="Action"
        onPress={() => console.log('Action clicked!')}>
        Action
      </Toast.Action>
    </Toast.Outer>
  )
}

export function Toasts() {
  return (
    <View style={[a.gap_md]}>
      <H1>Toast Examples</H1>

      <View style={[a.gap_md]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => Toast.show(<ToastWithAction />, {type: 'success'})}>
          <ToastWithAction />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => Toast.show(<ToastWithAction />, {type: 'error'})}>
          <ToastWithAction />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => Toast.show(<LongToastWithAction />)}>
          <LongToastWithAction />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => Toast.show(`Hey I'm a toast!`)}>
          <DefaultToast content="Hey I'm a toast!" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(`This toast will disappear after 6 seconds`, {
              duration: 6e3,
            })
          }>
          <DefaultToast content="This toast will disappear after 6 seconds" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(
              `This is a longer message to test how the toast handles multiple lines of text content.`,
            )
          }>
          <DefaultToast content="This is a longer message to test how the toast handles multiple lines of text content." />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(`Success! Yayyyyyyy :)`, {
              type: 'success',
            })
          }>
          <DefaultToast content="Success! Yayyyyyyy :)" type="success" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(`I'm providing info!`, {
              type: 'info',
            })
          }>
          <DefaultToast content="I'm providing info!" type="info" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(`This is a warning toast`, {
              type: 'warning',
            })
          }>
          <DefaultToast content="This is a warning toast" type="warning" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(`This is an error toast :(`, {
              type: 'error',
            })
          }>
          <DefaultToast content="This is an error toast :(" type="error" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            deprecatedShow(
              `This is a test of the deprecated API`,
              'exclamation-circle',
            )
          }>
          <DefaultToast
            content="This is a test of the deprecated API"
            type="warning"
          />
        </Pressable>
      </View>
    </View>
  )
}
