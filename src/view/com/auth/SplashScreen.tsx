import {View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useHaptics} from '#/lib/haptics'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {CenteredView} from '#/view/com/util/Views'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useTheme} from '#/alf'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

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
    <CenteredView style={[a.h_full, a.flex_1]}>
      <Animated.View
        entering={FadeIn.duration(90)}
        exiting={FadeOut.duration(90)}
        style={[a.flex_1]}>
        <ErrorBoundary>
          <View style={[a.flex_1, a.justify_center, a.align_center]}>
            <Logo width={92} fill="sky" />

            <View style={[a.pb_sm, a.pt_5xl]}>
              <Logotype width={161} fill={t.atoms.text.color} />
            </View>

            <Text
              style={[
                a.text_md,
                a.font_semi_bold,
                t.atoms.text_contrast_medium,
                a.text_center,
              ]}>
              <Trans>What's up?</Trans>
            </Text>
          </View>

          <View
            testID="signinOrCreateAccount"
            style={[a.px_xl, a.gap_md, a.pb_2xl]}>
            <Button
              testID="createAccountButton"
              onPress={() => {
                onPressCreateAccount()
                playHaptic('Light')
              }}
              label={_(msg`Create new account`)}
              accessibilityHint={_(
                msg`Opens flow to create a new Bluesky account`,
              )}
              size="large"
              variant="solid"
              color="primary">
              <ButtonText>
                <Trans>Create account</Trans>
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
              variant="solid"
              color="secondary">
              <ButtonText>
                <Trans>Sign in</Trans>
              </ButtonText>
            </Button>
          </View>
          <View
            style={[
              a.px_lg,
              a.pt_md,
              a.pb_2xl,
              a.justify_center,
              a.align_center,
            ]}>
            <View>
              <AppLanguageDropdown />
            </View>
          </View>
          <View style={{height: insets.bottom}} />
        </ErrorBoundary>
      </Animated.View>
    </CenteredView>
  )
}
