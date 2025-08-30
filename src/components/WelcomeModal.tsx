import React from 'react'
import {Animated, ImageBackground, StyleSheet, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

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
  const fadeAnim = React.useRef(new Animated.Value(1)).current

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
    fadeOutAndClose(() => {
      requestSwitchToAccount({requestedAccount: 'new'})
    })
  }, [fadeOutAndClose, requestSwitchToAccount])

  const onPressExplore = React.useCallback(() => {
    fadeOutAndClose()
  }, [fadeOutAndClose])

  const onPressSignIn = React.useCallback(() => {
    fadeOutAndClose(() => {
      requestSwitchToAccount({requestedAccount: 'existing'})
    })
  }, [fadeOutAndClose, requestSwitchToAccount])

  return (
    <Animated.View style={[styles.modalOverlay, {opacity: fadeAnim}]}>
      <View style={styles.modalContainer}>
        <ImageBackground source={welcomeModalBg} style={styles.backgroundImage}>
          <View style={styles.container}>
            {/* Header with Logo */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Logo width={24} />
                <Text style={[a.text_xl, a.font_bold, styles.headerText]}>
                  Bluesky
                </Text>
              </View>
            </View>

            {/* Main Content */}
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

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                onPress={onPressCreateAccount}
                label={_(msg`Create account`)}
                size="large"
                variant="solid"
                color="primary"
                style={styles.createAccountButton}>
                <ButtonText>
                  <Trans>Create account</Trans>
                </ButtonText>
              </Button>

              {/* Explore as link-style text */}
              <Text style={styles.exploreLink} onPress={onPressExplore}>
                <Trans>Explore the app</Trans>
              </Text>

              {/* Sign In Link */}
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.2)',
    ...web({
      backdropFilter: 'blur(10px)',
    }),
  },
  modalContainer: {
    maxWidth: 800,
    maxHeight: 600,
    width: '90%',
    height: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#C0DCF0',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    gap: 24,
    alignItems: 'center',
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 0,
    userSelect: 'none',
  },
  headerText: {
    color: '#354358',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mainContent: {
    gap: 10,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 48,
  },
  mainText: {
    color: '#354358',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtons: {
    gap: 16,
    alignItems: 'center',
    userSelect: 'none',
  },
  createAccountButton: {
    width: 200,
    backgroundColor: '#006AFF',
  },
  exploreLink: {
    fontSize: 16,
    color: '#006AFF',
    textDecorationLine: 'none',
    fontWeight: '500',
  },
  signInContainer: {
    alignItems: 'center',
    paddingTop: 8,
    padding: 0,
  },
  signInText: {
    color: '#1a1a1a',
    textDecorationLine: 'none',
  },
  signInLink: {
    color: '#006AFF',
    fontWeight: '500',
    fontSize: undefined,
  },
})
