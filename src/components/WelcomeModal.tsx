import React from 'react'
import {Animated, ImageBackground, StyleSheet, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, web} from '#/alf'
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
  const fadeAnim = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim])

  const fadeOutAndClose = React.useCallback(
    (callback?: () => void) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        control.close()
        if (callback) callback()
      })
    },
    [fadeAnim, control],
  )

  const onPressCreateAccount = React.useCallback(() => {
    logEvent('welcomeModal:signupClicked', {})
    fadeOutAndClose(() => {
      requestSwitchToAccount({requestedAccount: 'new'})
    })
  }, [fadeOutAndClose, requestSwitchToAccount])

  const onPressExplore = React.useCallback(() => {
    logEvent('welcomeModal:exploreClicked', {})
    fadeOutAndClose()
  }, [fadeOutAndClose])

  const onPressSignIn = React.useCallback(() => {
    logEvent('welcomeModal:signinClicked', {})
    fadeOutAndClose(() => {
      requestSwitchToAccount({requestedAccount: 'existing'})
    })
  }, [fadeOutAndClose, requestSwitchToAccount])

  return (
    <Animated.View style={[styles.modalOverlay, {opacity: fadeAnim}]}>
      <View style={styles.modalContainer}>
        <ImageBackground source={welcomeModalBg} style={styles.backgroundImage}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Logo width={24} />
                <Text style={[a.text_xl, a.font_bold, styles.headerText]}>
                  Bluesky
                </Text>
              </View>
            </View>
            <View style={styles.mainContent}>
              <Text
                style={[
                  a.text_4xl,
                  a.font_bold,
                  a.text_center,
                  styles.mainText,
                ]}>
                <Trans>Real people.</Trans>
              </Text>
              <Text
                style={[
                  a.text_4xl,
                  a.font_bold,
                  a.text_center,
                  styles.mainText,
                ]}>
                <Trans>Real conversations.</Trans>
              </Text>
              <Text
                style={[
                  a.text_4xl,
                  a.font_bold,
                  a.text_center,
                  styles.mainText,
                ]}>
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
              <Text style={styles.exploreLink} onPress={onPressExplore}>
                <Trans>Explore the app</Trans>
              </Text>
              <View style={styles.signInContainer}>
                <Text style={[a.text_md, styles.signInText]}>
                  <Trans>Already have an account?</Trans>{' '}
                  <Text style={styles.signInLink} onPress={onPressSignIn}>
                    <Trans>Sign in</Trans>
                  </Text>
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
    ...a.pb_5xl,
  },
  mainText: {
    color: '#354358',
    ...a.font_medium,
    ...a.text_center,
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
  signInContainer: {
    ...a.align_center,
    ...a.pt_sm,
    ...a.p_0,
  },
  signInText: {
    color: '#1a1a1a',
    ...web({
      textDecorationLine: 'none',
    }),
  },
  signInLink: {
    color: '#006AFF',
    ...a.font_medium,
    fontSize: undefined,
  },
})
