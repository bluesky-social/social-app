import {useMemo} from 'react'
import {Image as RNImage, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
// @ts-ignore
import splashImagePointer from '../../../../assets/splash/illustration-mobile.png'
// @ts-ignore
import darkSplashImagePointer from '../../../../assets/splash/illustration-mobile-dark.png'
const splashImageUri = RNImage.resolveAssetSource(splashImagePointer).uri
const darkSplashImageUri = RNImage.resolveAssetSource(
  darkSplashImagePointer,
).uri

export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const t = useTheme()
  const {_} = useLingui()
  const isDarkMode = t.name !== 'light'

  const playHaptic = useHaptics()

  const styles = useMemo(() => {
    const logoFill = isDarkMode ? 'white' : t.palette.primary_500
    return {
      logoFill,
      logoShadow: isDarkMode
        ? [
            t.atoms.shadow_md,
            {
              shadowColor: logoFill,
              shadowOpacity: 0.5,
              shadowOffset: {
                width: 0,
                height: 0,
              },
            },
          ]
        : [],
    }
  }, [t, isDarkMode])

  return (
    <>
      <Image
        accessibilityIgnoresInvertColors
        source={{uri: isDarkMode ? darkSplashImageUri : splashImageUri}}
        style={[a.absolute, a.inset_0]}
      />

      <Animated.View
        entering={FadeIn.duration(90)}
        exiting={FadeOut.duration(90)}
        style={[a.flex_1]}>
        <View
          style={[a.justify_center, a.align_center, {gap: 6, paddingTop: 46}]}>
          <Logo width={76} fill={styles.logoFill} style={styles.logoShadow} />
          <Logotype
            width={91}
            fill={styles.logoFill}
            style={styles.logoShadow}
          />
        </View>

        <View style={[a.flex_1]} />

        <View
          testID="signinOrCreateAccount"
          style={[a.px_5xl, a.gap_md, a.pb_sm]}>
          <View
            style={[
              t.atoms.shadow_md,
              {
                shadowOpacity: 0.1,
                shadowOffset: {
                  width: 0,
                  height: 5,
                },
              },
            ]}>
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
              color={isDarkMode ? 'secondary_inverted' : 'secondary'}>
              <ButtonText>
                <Trans>Create account</Trans>
              </ButtonText>
            </Button>
          </View>

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
            size="large">
            <ButtonText style={{color: 'white'}}>
              <Trans>Sign in</Trans>
            </ButtonText>
          </Button>
        </View>
      </Animated.View>
    </>
  )
}
