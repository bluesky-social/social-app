import {useEffect, useState} from 'react'
import {Animated, Pressable, View} from 'react-native'
import {ImageBackground} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnimatedValue} from '#/lib/hooks/useAnimatedValue'
import {logger} from '#/logger'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from './icons/Times'

const welcomeModalBg = require('../../assets/images/welcome-modal-bg.jpg')

interface WelcomeModalProps {
  control: {
    isOpen: boolean
    open: () => void
    close: () => void
  }
}

export function WelcomeModal({control}: WelcomeModalProps) {
  const {_} = useLingui()
  const t = useTheme()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const {gtMobile} = useBreakpoints()
  const fadeAnim = useAnimatedValue(0)
  const [signInLinkHovered, setSignInLinkHovered] = useState(false)

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim])

  const fadeOutAndClose = (callback?: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      control.close()
      if (callback) callback()
    })
  }

  const onPressCreateAccount = () => {
    logger.metric('welcomeModal:signupClicked', {})
    fadeOutAndClose(() => {
      requestSwitchToAccount({requestedAccount: 'new'})
    })
  }

  const onPressExplore = () => {
    logger.metric('welcomeModal:exploreClicked', {})
    fadeOutAndClose()
  }

  const onPressSignIn = () => {
    logger.metric('welcomeModal:signinClicked', {})
    fadeOutAndClose(() => {
      requestSwitchToAccount({requestedAccount: 'existing'})
    })
  }

  return (
    <Animated.View
      style={[
        a.fixed,
        a.inset_0,
        a.justify_center,
        a.align_center,
        {zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.2)'},
        web({backdropFilter: 'blur(15px)'}),
        {opacity: fadeAnim},
      ]}>
      <View
        style={[
          {
            maxWidth: 800,
            maxHeight: 600,
            width: '90%',
            height: '90%',
            backgroundColor: '#C0DCF0',
          },
          a.rounded_lg,
          a.overflow_hidden,
        ]}>
        <ImageBackground
          source={welcomeModalBg}
          style={[a.flex_1, a.justify_center]}
          contentFit="cover">
          <Button
            label={_(msg`Close welcome modal`)}
            style={[
              a.absolute,
              {
                top: 8,
                right: 8,
              },
              a.bg_transparent,
            ]}
            hoverStyle={[a.bg_transparent]}
            onPress={() => fadeOutAndClose()}
            color="secondary"
            size="small"
            variant="ghost"
            shape="round">
            {({hovered, pressed}) => (
              <XIcon
                size="md"
                style={[
                  hovered || pressed
                    ? t.atoms.text
                    : t.atoms.text_contrast_medium,
                ]}
              />
            )}
          </Button>
          <View style={[a.gap_2xl, a.align_center, a.p_4xl]}>
            <View
              style={[
                a.flex_row,
                a.align_center,
                a.justify_center,
                a.w_full,
                a.p_0,
              ]}>
              <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                <Logo width={26} />
                <Text
                  style={[
                    a.text_2xl,
                    a.font_bold,
                    a.user_select_none,
                    {color: '#354358', letterSpacing: -0.5},
                  ]}>
                  Bluesky
                </Text>
              </View>
            </View>
            <View
              style={[a.gap_sm, a.align_center, a.pt_5xl, a.pb_3xl, a.mt_2xl]}>
              <Text
                style={[
                  gtMobile ? a.text_4xl : a.text_3xl,
                  a.font_bold,
                  a.text_center,
                  {color: '#354358'},
                  web({
                    backgroundImage:
                      'linear-gradient(180deg, #313F54 0%, #667B99 83.65%, rgba(102, 123, 153, 0.50) 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                    lineHeight: 1.2,
                    letterSpacing: -0.5,
                  }),
                ]}>
                <Trans>Real people.</Trans>
                {'\n'}
                <Trans>Real conversations.</Trans>
                {'\n'}
                <Trans>Social media you control.</Trans>
              </Text>
            </View>
            <View style={[a.gap_lg, a.align_center]}>
              <Button
                onPress={onPressCreateAccount}
                label={_(msg`Create account`)}
                size="large"
                color="primary"
                style={{
                  width: 200,
                  backgroundColor: '#006AFF',
                }}>
                <ButtonText>
                  <Trans>Create account</Trans>
                </ButtonText>
              </Button>
              <Button
                onPress={onPressExplore}
                label={_(msg`Explore the app`)}
                size="large"
                color="primary"
                variant="ghost"
                style={[a.bg_transparent, {width: 200}]}
                hoverStyle={[a.bg_transparent]}>
                {({hovered}) => (
                  <ButtonText style={hovered && [a.underline]}>
                    <Trans>Explore the app</Trans>
                  </ButtonText>
                )}
              </Button>
              <View style={[a.align_center, a.pt_sm]}>
                <Text style={[a.text_md, {color: '#405168'}]}>
                  <Trans>Already have an account?</Trans>{' '}
                  <Pressable
                    onPointerEnter={() => setSignInLinkHovered(true)}
                    onPointerLeave={() => setSignInLinkHovered(false)}
                    accessibilityRole="button"
                    accessibilityLabel={_(msg`Sign in`)}
                    accessibilityHint="">
                    <Text
                      style={[
                        a.font_medium,
                        {
                          color: '#006AFF',
                          fontSize: undefined,
                        },
                        signInLinkHovered && a.underline,
                      ]}
                      onPress={onPressSignIn}>
                      <Trans>Sign in</Trans>
                    </Text>
                  </Pressable>
                </Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    </Animated.View>
  )
}
