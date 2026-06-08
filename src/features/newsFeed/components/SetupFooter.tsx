import {type ReactNode} from 'react'
import {View} from 'react-native'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'

import {useShellLayout} from '#/state/shell/shell-layout'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'

// Bottom action bar, raised by the shell footer height to clear the tab bar on
// native (footerHeight is 0 on web).
export function SetupFooter({children}: {children: ReactNode}) {
  const t = useTheme()
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
