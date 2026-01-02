import {View} from 'react-native'
import {SystemBars} from 'react-native-edge-to-edge'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {ImageBackground} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useHaptics} from '#/lib/haptics'
import {atoms as a, ThemeProvider, tokens, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {LogoMark, LogoType} from '#/components/icons/Logo'

const BACKGROUND_GREEN = '#689C60'

export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const t = useTheme()
  const {_} = useLingui()

  const playHaptic = useHaptics()
  const insets = useSafeAreaInsets()

  return (
    <Animated.View
      style={[a.h_full, a.flex_1, {backgroundColor: BACKGROUND_GREEN}]}
      entering={FadeIn.duration(90)}
      exiting={FadeOut.duration(90)}>
      <SystemBars style={{statusBar: 'dark'}} />
      <ImageBackground
        source={require('../../../../assets/splash-illustration.webp')}
        contentFit="cover"
        style={[a.flex_1, a.align_center]}>
        <Animated.View
          style={[a.absolute, {top: '15%'}, a.align_center, a.gap_2xs]}>
          <LogoMark width={85} />
          <LogoType width={92.1} height={24.56} />
        </Animated.View>
      </ImageBackground>
      <ThemeProvider theme="dark">
        <View
          style={[
            a.w_full,
            a.flex_shrink_0,
            a.px_5xl,
            a.gap_sm,
            {paddingBottom: insets.bottom + tokens.space.sm},
          ]}>
          <Button
            testID="createAccountButton"
            onPress={() => {
              onPressCreateAccount()
              playHaptic('Light')
            }}
            label={_(msg`Get started`)}
            accessibilityHint={_(
              msg`Opens flow to create a new Bluesky account`,
            )}
            size="large"
            color="secondary_inverted"
            style={[{backgroundColor: t.palette.white}, a.shadow_sm]}>
            <ButtonText>
              <Trans>Get started</Trans>
            </ButtonText>
          </Button>
          <Button
            testID="signInButton"
            onPress={() => {
              onPressSignin()
              playHaptic('Light')
            }}
            label={_(msg`Sign in`)}
            accessibilityHint={_(
              msg`Opens flow to sign in to your existing Bluesky account`,
            )}
            size="large"
            color="secondary"
            style={[a.bg_transparent]}
            hoverStyle={[a.bg_transparent, {opacity: 0.8}]}>
            <ButtonText style={{color: t.palette.white}}>
              <Trans>Sign in</Trans>
            </ButtonText>
          </Button>
        </View>
      </ThemeProvider>
    </Animated.View>
  )
}
