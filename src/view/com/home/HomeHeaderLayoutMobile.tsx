import {View} from 'react-native'
import Animated, {runOnJS, useAnimatedReaction} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useIsFocused, useNavigation} from '@react-navigation/native'

import {HITSLOP_10} from '#/lib/constants'
import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useHaptics} from '#/lib/haptics'
import {useMinimalShellHeaderTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {emitSoftReset} from '#/state/events'
import {useSession} from '#/state/session'
import {useMinimalShellMode} from '#/state/shell'
import {useShellLayout} from '#/state/shell/shell-layout'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import {Hashtag_Stroke2_Corner0_Rounded as FeedsIcon} from '#/components/icons/Hashtag'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'

export function HomeHeaderLayoutMobile({
  children,
}: {
  children: React.ReactNode
  tabBarAnchor: React.ReactElement | null | undefined
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {headerHeight} = useShellLayout()
  const insets = useSafeAreaInsets()
  const {headerMode} = useMinimalShellMode()
  const headerMinimalShellTransform = useMinimalShellHeaderTransform()
  const {hasSession} = useSession()
  const playHaptic = useHaptics()
  const navigation = useNavigation()
  const isFocused = useIsFocused()

  const updateNativeHeader = useNonReactiveCallback((visible: boolean) => {
    if (!isFocused) return

    if (visible) {
      navigation.setOptions({
        headerShown: false,

        headerTransparent: true,
        headerEdgeEffects: {top: 'soft'},
      })
    } else {
      navigation.setOptions({
        headerShown: true,
        headerTitle: 'Bluesky team',

        headerTransparent: true,
        headerEdgeEffects: {top: 'soft'},
      })
    }
  })

  useAnimatedReaction(
    () => headerMode.get() < 0.5,
    (curr, prev) => {
      if (prev === curr) return
      runOnJS(updateNativeHeader)(curr)
    },
  )

  return (
    <Animated.View
      style={[
        a.fixed,
        a.z_10,
        t.atoms.bg,
        {
          paddingTop: insets.top,
          top: 0,
          left: 0,
          right: 0,
        },
        headerMinimalShellTransform,
      ]}
      onLayout={e => {
        console.log({height: e.nativeEvent.layout.height})
        headerHeight.set(e.nativeEvent.layout.height)
      }}>
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.Slot>
          <Layout.Header.MenuButton />
        </Layout.Header.Slot>

        <View style={[a.flex_1, a.align_center]}>
          <PressableScale
            targetScale={0.9}
            onPress={() => {
              playHaptic('Light')
              emitSoftReset()
            }}>
            <Logo width={30} />
          </PressableScale>
        </View>

        <Layout.Header.Slot>
          {hasSession && (
            <Link
              testID="viewHeaderHomeFeedPrefsBtn"
              to={{screen: 'Feeds'}}
              hitSlop={HITSLOP_10}
              label={_(msg`View your feeds and explore more`)}
              size="small"
              variant="ghost"
              color="secondary"
              shape="square"
              style={[
                a.justify_center,
                {marginRight: -Layout.BUTTON_VISUAL_ALIGNMENT_OFFSET},
                a.bg_transparent,
              ]}>
              <ButtonIcon icon={FeedsIcon} size="lg" />
            </Link>
          )}
        </Layout.Header.Slot>
      </Layout.Header.Outer>
      {children}
    </Animated.View>
  )
}
