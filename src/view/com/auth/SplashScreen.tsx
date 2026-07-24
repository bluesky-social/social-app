import {useMemo} from 'react'
import {Image as RNImage, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'
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
  const {t: l} = useLingui()
  const isDarkMode = t.name !== 'light'

  const playHaptic = useHaptics()

  const styles = useMemo(() => {
    const logoFill = isDarkMode ? 'white' : t.palette.primary_500
    return {
      logoFill,
      logoShadow: isDarkMode
        ? [
            {
              shadowColor: logoFill,
              shadowRadius: 8,
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
          <Button
            testID="createAccountButton"
            onPress={() => {
              onPressCreateAccount()
              playHaptic('Light')
            }}
            label={l`Create new account`}
            accessibilityHint={l`Opens flow to create a new Bluesky account`}
            size="large"
            color={isDarkMode ? 'secondary_inverted' : 'secondary'}
            style={[
              {
                shadowColor: t.palette.black,
                shadowRadius: 8,
                shadowOpacity: 0.1,
                shadowOffset: {
                  width: 0,
                  height: 5,
                },
                elevation: 16,
              },
            ]}>
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
            label={l`Sign in`}
            accessibilityHint={l`Opens flow to sign in to your existing Bluesky account`}
            size="large"
            hoverStyle={{opacity: 0.5}}>
            <ButtonText style={{color: 'white'}}>
              <Trans>Sign in</Trans>
            </ButtonText>
          </Button>
        </View>
      </Animated.View>
    </>
  )
}
