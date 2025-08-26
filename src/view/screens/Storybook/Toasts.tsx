import {Pressable, View} from 'react-native'

import {show as deprecatedShow} from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import * as Toast from '#/components/Toast'
import {Default} from '#/components/Toast/Toast'
import {H1} from '#/components/Typography'

function ToastWithAction({type = 'default'}: {type?: Toast.ToastType}) {
  return (
    <Toast.Outer type={type}>
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

function LongToastWithAction({type = 'default'}: {type?: Toast.ToastType}) {
  return (
    <Toast.Outer type={type}>
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
        <View style={[a.gap_md, {marginHorizontal: a.px_xl.paddingLeft * -1}]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => Toast.show(<ToastWithAction />)}>
            <ToastWithAction />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => Toast.show(<LongToastWithAction />)}>
            <LongToastWithAction />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => Toast.show(<ToastWithAction type="success" />)}>
            <ToastWithAction type="success" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => Toast.show(<ToastWithAction type="error" />)}>
            <ToastWithAction type="error" />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => Toast.show(`Hey I'm a toast!`)}>
          <Default content="Hey I'm a toast!" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(`This toast will disappear after 6 seconds`, {
              duration: 6e3,
            })
          }>
          <Default content="This toast will disappear after 6 seconds" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(
              `This is a longer message to test how the toast handles multiple lines of text content.`,
            )
          }>
          <Default content="This is a longer message to test how the toast handles multiple lines of text content." />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(`Success! Yayyyyyyy :)`, {
              type: 'success',
            })
          }>
          <Default content="Success! Yayyyyyyy :)" type="success" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(`I'm providing info!`, {
              type: 'info',
            })
          }>
          <Default content="I'm providing info!" type="info" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(`This is a warning toast`, {
              type: 'warning',
            })
          }>
          <Default content="This is a warning toast" type="warning" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Toast.show(`This is an error toast :(`, {
              type: 'error',
            })
          }>
          <Default content="This is an error toast :(" type="error" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            deprecatedShow(
              `This is a test of the deprecated API`,
              'exclamation-circle',
            )
          }>
          <Default
            content="This is a test of the deprecated API"
            type="warning"
          />
        </Pressable>
      </View>
    </View>
  )
}
