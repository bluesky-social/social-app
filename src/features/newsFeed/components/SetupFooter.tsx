import {type ReactNode} from 'react'
import {View} from 'react-native'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'

import {useShellLayout} from '#/state/shell/shell-layout'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {IS_WEB} from '#/env'

// Bottom action bar. On web, a plain View with position:fixed so it reliably
// sticks to the viewport (Reanimated's style application breaks fixed on web).
// On native, Animated.View with position:absolute + bottom:footerHeight to
// clear the tab bar.
export function SetupFooter({children}: {children: ReactNode}) {
  const t = useTheme()

  if (IS_WEB) {
    return (
      // @ts-ignore position: fixed is web only
      <View style={[{position: 'fixed', bottom: 0, left: 0, right: 0}]}>
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

  return <NativeSetupFooter t={t}>{children}</NativeSetupFooter>
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
    bottom: footerHeight.get(),
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
