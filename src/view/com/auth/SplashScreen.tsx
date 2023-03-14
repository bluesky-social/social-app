import React from 'react'
import {SafeAreaView, StyleSheet, TouchableOpacity, View} from 'react-native'
import Image, {Source as ImageSource} from 'view/com/util/images/Image'
import {Text} from 'view/com/util/text/Text'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {CLOUD_SPLASH} from 'lib/assets'
import {CenteredView} from '../util/Views'

export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const pal = usePalette('default')
  return (
    <CenteredView style={styles.container}>
      <Image source={CLOUD_SPLASH as ImageSource} style={styles.bgImg} />
      <SafeAreaView testID="noSessionView" style={styles.container}>
        <ErrorBoundary>
          <View style={styles.hero}>
            <View style={styles.heroText}>
              <Text style={styles.title}>Bluesky</Text>
            </View>
          </View>
          <View testID="signinOrCreateAccount" style={styles.btns}>
            <TouchableOpacity
              testID="createAccountButton"
              style={[pal.view, styles.btn]}
              onPress={onPressCreateAccount}>
              <Text style={[pal.link, styles.btnLabel]}>
                Create a new account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="signInButton"
              style={[pal.view, styles.btn]}
              onPress={onPressSignin}>
              <Text style={[pal.link, styles.btnLabel]}>Sign in</Text>
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
  bgImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroText: {
    backgroundColor: colors.white,
    paddingTop: 10,
    paddingBottom: 20,
  },
  btns: {
    paddingBottom: 40,
  },
  title: {
    textAlign: 'center',
    color: colors.blue3,
    fontSize: 68,
    fontWeight: 'bold',
  },
  btn: {
    borderRadius: 4,
    paddingVertical: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: colors.blue3,
  },
  btnLabel: {
    textAlign: 'center',
    fontSize: 21,
    color: colors.white,
  },
})
