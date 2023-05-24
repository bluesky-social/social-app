import React from 'react'
import {SafeAreaView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {CenteredView} from '../util/Views'
import {useTranslation} from 'react-i18next'

export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const pal = usePalette('default')
  const {t} = useTranslation()
  return (
    <CenteredView style={[styles.container, pal.view]}>
      <SafeAreaView testID="noSessionView" style={styles.container}>
        <ErrorBoundary>
          <View style={styles.hero}>
            <Text style={[styles.title, pal.link]}>
              {t('glossary:bluesky')}
            </Text>
            <Text style={[styles.subtitle, pal.textLight]}>
              {t('auth:splash.screen.see.what.next')}
            </Text>
          </View>
          <View testID="signinOrCreateAccount" style={styles.btns}>
            <TouchableOpacity
              testID="createAccountButton"
              style={[styles.btn, {backgroundColor: colors.blue3}]}
              onPress={onPressCreateAccount}
              accessibilityRole="button"
              accessibilityLabel="Create new account"
              accessibilityHint="Opens flow to create a new Bluesky account">
              <Text style={[s.white, styles.btnLabel]}>
                {t('auth:splash.screen.create.acc')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="signInButton"
              style={[styles.btn, pal.btn]}
              onPress={onPressSignin}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityHint="Opens flow to sign into your existing Bluesky account">
              <Text style={[pal.text, styles.btnLabel]}>
                {t('auth:splash.screen.sign.in')}
              </Text>
            </TouchableOpacity>
          </View>
        </ErrorBoundary>
      </SafeAreaView>
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
