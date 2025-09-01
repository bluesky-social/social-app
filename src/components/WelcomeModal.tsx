import {useEffect, useState} from 'react'
import {
  Animated,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnimatedValue} from '#/lib/hooks/useAnimatedValue'
import {logger} from '#/logger'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useBreakpoints, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

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
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const {gtMobile} = useBreakpoints()
  const fadeAnim = useAnimatedValue(0)
  const [closeButtonHovered, setCloseButtonHovered] = useState(false)
  const [exploreLinkHovered, setExploreLinkHovered] = useState(false)
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
    <Animated.View style={[styles.modalOverlay, {opacity: fadeAnim}]}>
      <View style={styles.modalContainer}>
        <ImageBackground source={welcomeModalBg} style={styles.backgroundImage}>
          <Pressable
            style={styles.closeButton}
            onPress={() => fadeOutAndClose()}
            onPointerEnter={() => setCloseButtonHovered(true)}
            onPointerLeave={() => setCloseButtonHovered(false)}
            accessibilityRole="button"
            accessibilityLabel="Close modal"
            accessibilityHint="Closes the welcome modal">
            <Text
              style={[
                styles.closeButtonText,
                closeButtonHovered && styles.closeButtonTextHovered,
              ]}>
              ×
            </Text>
          </Pressable>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Logo width={26} />
                <Text style={[a.text_2xl, styles.headerText]}>Bluesky</Text>
              </View>
            </View>
            <View style={styles.mainContent}>
              <Text
                style={[
                  gtMobile ? a.text_4xl : a.text_3xl,
                  a.font_bold,
                  a.text_center,
                  styles.mainText,
                ]}>
                <Trans>Real people.</Trans>
                {'\n'}
                <Trans>Real conversations.</Trans>
                {'\n'}
                <Trans>Social media you control.</Trans>
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <Button
                onPress={onPressCreateAccount}
                label={_(msg`Create account`)}
                size="large"
                color="primary"
                style={styles.createAccountButton}>
                <ButtonText>
                  <Trans>Create account</Trans>
                </ButtonText>
              </Button>
              <Pressable
                onPointerEnter={() => setExploreLinkHovered(true)}
                onPointerLeave={() => setExploreLinkHovered(false)}
                accessibilityRole="button"
                accessibilityLabel="Explore the app"
                accessibilityHint="Closes the modal and allows you to explore the app">
                <Text
                  style={[
                    styles.exploreLink,
                    exploreLinkHovered && styles.exploreLinkHovered,
                  ]}
                  onPress={onPressExplore}>
                  <Trans>Explore the app</Trans>
                </Text>
              </Pressable>
              <View style={styles.signInContainer}>
                <Text style={[a.text_md, styles.signInText]}>
                  <Trans>Already have an account?</Trans>{' '}
                  <Pressable
                    onPointerEnter={() => setSignInLinkHovered(true)}
                    onPointerLeave={() => setSignInLinkHovered(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in"
                    accessibilityHint="Opens the sign in dialog">
                    <Text
                      style={[
                        styles.signInLink,
                        signInLinkHovered && styles.signInLinkHovered,
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

const styles = StyleSheet.create({
  modalOverlay: {
    ...a.fixed,
    ...a.inset_0,
    ...a.justify_center,
    ...a.align_center,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.2)',
    ...web({
      backdropFilter: 'blur(15px)',
    }),
  },
  modalContainer: {
    maxWidth: 800,
    maxHeight: 600,
    width: '90%',
    height: '90%',
    ...a.rounded_lg,
    ...a.overflow_hidden,
    backgroundColor: '#C0DCF0',
  },
  backgroundImage: {
    ...a.flex_1,
    resizeMode: 'cover',
    ...a.justify_center,
  },
  container: {
    ...a.gap_2xl,
    ...a.align_center,
    ...a.p_4xl,
  },
  header: {
    ...a.flex_row,
    ...a.align_center,
    ...a.justify_center,
    ...a.w_full,
    ...a.p_0,
    ...web({
      userSelect: 'none',
    }),
  },
  headerText: {
    color: '#354358',
    ...a.font_bold,
    letterSpacing: -0.5,
  },
  logoContainer: {
    ...a.flex_row,
    ...a.align_center,
    ...a.gap_xs,
  },
  mainContent: {
    ...a.gap_sm,
    ...a.align_center,
    ...a.pt_5xl,
    ...a.pb_3xl,
    ...a.mt_2xl,
  },
  mainText: {
    color: '#354358',
    ...a.font_bold,
    ...a.text_center,
    ...web({
      backgroundImage:
        'linear-gradient(180deg, #313F54 0%, #667B99 83.65%, rgba(102, 123, 153, 0.50) 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
      lineHeight: 1.2,
      letterSpacing: -0.5,
    }),
  },
  actionButtons: {
    ...a.gap_lg,
    ...a.align_center,
    ...web({
      userSelect: 'none',
    }),
  },
  createAccountButton: {
    width: 200,
    backgroundColor: '#006AFF',
  },
  exploreLink: {
    ...a.text_md,
    color: '#006AFF',
    ...web({
      textDecorationLine: 'none',
    }),
    ...a.font_medium,
  },
  exploreLinkHovered: {
    ...web({
      textDecorationLine: 'underline',
    }),
  },
  signInContainer: {
    ...a.align_center,
    ...a.pt_sm,
    ...a.p_0,
  },
  signInText: {
    color: '#405168',
    ...web({
      textDecorationLine: 'none',
    }),
  },
  signInLink: {
    color: '#006AFF',
    ...a.font_medium,
    fontSize: undefined,
  },
  signInLinkHovered: {
    ...web({
      textDecorationLine: 'underline',
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: 30,
    color: '#354358',
    opacity: 0.7,
  },
  closeButtonTextHovered: {
    opacity: 1,
  },
})
