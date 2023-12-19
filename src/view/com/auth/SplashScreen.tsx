import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {CenteredView} from '../util/Views'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'

export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const pal = usePalette('default')
  const {_} = useLingui()

  return (
    <CenteredView style={[styles.container, pal.view]}>
      <ErrorBoundary>
        <View style={styles.hero}>
          <Logo width={92} fill="sky" />

          <View style={{paddingTop: 40, paddingBottom: 6}}>
            <Logotype width={161} fill={pal.text.color} />
          </View>

          <Text type="lg-medium" style={[pal.textLight]}>
            <Trans>What's up?</Trans>
          </Text>
        </View>
        <View testID="signinOrCreateAccount" style={styles.btns}>
          <TouchableOpacity
            testID="createAccountButton"
            style={[styles.btn, {backgroundColor: colors.blue3}]}
            onPress={onPressCreateAccount}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Create new account`)}
            accessibilityHint="Opens flow to create a new Bluesky account">
            <Text style={[s.white, styles.btnLabel]}>
              <Trans>Create a new account</Trans>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="signInButton"
            style={[styles.btn, pal.btn]}
            onPress={onPressSignin}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Sign in`)}
            accessibilityHint="Opens flow to sign into your existing Bluesky account">
            <Text style={[pal.text, styles.btnLabel]}>
              <Trans>Sign In</Trans>
            </Text>
          </TouchableOpacity>
        </View>
      </ErrorBoundary>
    </CenteredView>
  )
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  hero: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btns: {
    paddingBottom: 40,
  },
  title: {
    textAlign: 'center',
    fontSize: 68,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 42,
    fontWeight: 'bold',
  },
  btn: {
    borderRadius: 32,
    paddingVertical: 16,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  btnLabel: {
    textAlign: 'center',
    fontSize: 21,
  },
})
