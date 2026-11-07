import {View} from 'react-native'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Trans} from '@lingui/react/macro'

import {useShellLayout} from '#/state/shell/shell-layout'
import {atoms as a, useTheme} from '#/alf'
import {Earth_Stroke2_Corner0_Rounded as EarthIcon} from '#/components/icons/Earth'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useHasNativeTabs} from '#/features/verticalBar'

export function AtmosphereActivityTab() {
  const t = useTheme()
  const {footerHeight} = useShellLayout()
  // With native tabs there's no footer, but the safe area includes the tab bar
  const {bottom: bottomInset} = useSafeAreaInsets()
  const hasNativeTabs = useHasNativeTabs()
  const animatedStyle = useAnimatedStyle(() => ({
    paddingBottom: hasNativeTabs ? bottomInset : footerHeight.get(),
  }))

  return (
    <Animated.View style={[a.flex_1, animatedStyle]}>
      <Layout.Center style={[a.flex_1, a.align_center, a.justify_center]}>
        <View style={[a.align_center, a.gap_lg]}>
          <EarthIcon size="4xl" style={[t.atoms.text_contrast_low]} />
          <View style={[a.align_center, a.gap_xs]}>
            <Text style={[a.text_md, a.font_semi_bold, a.text_center]}>
              <Trans>Your Atmosphere is quiet</Trans>
            </Text>
            <Text
              style={[
                a.text_sm,
                a.text_center,
                t.atoms.text_contrast_low,
                {maxWidth: 300},
              ]}>
              <Trans>
                The Atmosphere is the open network Bluesky is built on. When
                people you follow are active on the Atmosphere, you can see it
                here.
              </Trans>
            </Text>
          </View>
        </View>
      </Layout.Center>
    </Animated.View>
  )
}
