import {type ReactNode, useState} from 'react'
import {View} from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated'

import {useShellLayout} from '#/state/shell/shell-layout'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {IS_WEB} from '#/env'

export function SetupFooter({children}: {children: ReactNode}) {
  const t = useTheme()

  if (IS_WEB) {
    return <WebSetupFooter t={t}>{children}</WebSetupFooter>
  }

  return <NativeSetupFooter t={t}>{children}</NativeSetupFooter>
}

function WebSetupFooter({
  children,
  t,
}: {
  children: ReactNode
  t: ReturnType<typeof useTheme>
}) {
  const {footerHeight} = useShellLayout()
  const [bottom, setBottom] = useState(() => footerHeight.get())

  useAnimatedReaction(
    () => footerHeight.value,
    val => runOnJS(setBottom)(val),
  )

  return (
    // @ts-ignore position: fixed is web only
    <View style={[{position: 'fixed', bottom, left: 0, right: 0}]}>
      <Layout.Center>
        <View
          style={[
            a.px_xl,
            a.py_md,
            a.border_t,
            t.atoms.border_contrast_low,
            t.atoms.bg,
          ]}>
          {children}
        </View>
      </Layout.Center>
    </View>
  )
}

function NativeSetupFooter({
  children,
  t,
}: {
  children: ReactNode
  t: ReturnType<typeof useTheme>
}) {
  const {footerHeight} = useShellLayout()
  const animatedStyle = useAnimatedStyle(() => ({
    bottom: footerHeight.value,
  }))

  return (
    <Animated.View style={[a.absolute, {left: 0, right: 0}, animatedStyle]}>
      <Layout.Center>
        <View
          style={[
            a.px_xl,
            a.py_md,
            a.border_t,
            t.atoms.border_contrast_low,
            t.atoms.bg,
          ]}>
          {children}
        </View>
      </Layout.Center>
    </Animated.View>
  )
}
