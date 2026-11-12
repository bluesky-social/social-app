import {useMemo, useState} from 'react'
import {View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {useSafeAreaFrame} from 'react-native-safe-area-context'
import {BlurView} from 'expo-blur'
import {Image, type ImageContentPosition} from 'expo-image'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
// @ts-expect-error
import phoneArt from '../../../../assets/illustrations/illustration-mobile.webp'
// @ts-expect-error
import darkPhoneArt from '../../../../assets/illustrations/illustration-mobile-dark.webp'
// @ts-expect-error
import darkSafeArt from '../../../../assets/illustrations/illustration-mobile-dark-safe.webp'
// @ts-expect-error
import safeArt from '../../../../assets/illustrations/illustration-mobile-safe.webp'

const ART = {
  phone: {light: phoneArt, dark: darkPhoneArt},
  safe: {light: safeArt, dark: darkSafeArt},
}

/**
 * The phone art extends the illustration with extra sky above and flat green
 * ground below for the buttons to sit on. Those extensions only line up with
 * the artwork in the middle: further out they cut through a cloud and a man's
 * legs. Cover-cropping keeps the cuts offscreen up to 9:16, which is as wide as
 * phones get, so anything wider shows the unextended "safe" art instead.
 */
const MAX_PHONE_ART_ASPECT_RATIO = 0.57

/**
 * When the safe art is cropped top and bottom, take more from the bottom so
 * the logo stays on the sky.
 */
const SAFE_ART_POSITION: ImageContentPosition = {top: '25%', left: '50%'}

export function NativeSplashScreen({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) {
  const t = useTheme()
  const {gtPhone} = useBreakpoints()
  const {_} = useLingui()
  const isDarkMode = t.name !== 'light'

  const haptics = useHaptics()

  /*
   * The root frame is right on the first render, so phones never flash the
   * safe art. After that, follow the measured size: on web the frame doesn't
   * update when the window is resized.
   */
  const frame = useSafeAreaFrame()
  const [size, setSize] = useState<{width: number; height: number}>()
  const {width, height} = size ?? frame
  const isPhoneShaped = width / height <= MAX_PHONE_ART_ASPECT_RATIO

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
      <View
        style={[a.absolute, a.inset_0]}
        onLayout={evt => {
          const layout = evt.nativeEvent.layout
          if (layout.width > 0 && layout.height > 0) {
            setSize({width: layout.width, height: layout.height})
          }
        }}>
        <Image
          accessibilityIgnoresInvertColors
          source={
            ART[isPhoneShaped ? 'phone' : 'safe'][isDarkMode ? 'dark' : 'light']
          }
          contentPosition={isPhoneShaped ? 'center' : SAFE_ART_POSITION}
          style={[a.absolute, a.inset_0]}
        />
      </View>

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
          style={[
            a.px_5xl,
            a.gap_md,
            isPhoneShaped ? a.pb_sm : a.pb_xl,
            gtPhone && [a.w_full, a.self_center, {maxWidth: 600}],
          ]}>
          <Button
            testID="createAccountButton"
            onPress={() => {
              onPressCreateAccount()
              haptics.tap()
            }}
            label={_(msg`Create new account`)}
            accessibilityHint={_(
              msg`Opens flow to create a new Bluesky account`,
            )}
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
              haptics.tap()
            }}
            label={_(msg`Sign in`)}
            accessibilityHint={_(
              msg`Opens flow to sign in to your existing Bluesky account`,
            )}
            size="large"
            /*
             * Only the phone art has flat ground under this button, so
             * elsewhere it gets the same dark glass as the lightbox chrome to
             * stay legible over the busy part of the illustration. The fill
             * goes on the button because the web BlurView overrides its own.
             */
            style={
              !isPhoneShaped && [
                a.overflow_hidden,
                {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
              ]
            }
            hoverStyle={{opacity: 0.5}}>
            {!isPhoneShaped && (
              <BlurView
                intensity={20}
                tint="dark"
                style={[a.absolute, a.inset_0]}
              />
            )}
            <ButtonText style={{color: 'white'}}>
              <Trans>Sign in</Trans>
            </ButtonText>
          </Button>
        </View>
      </Animated.View>
    </>
  )
}
