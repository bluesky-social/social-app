import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {CenteredView} from '../util/Views'

export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const pal = usePalette('default')
  const store = useStores()

  const onPressWaitlist = React.useCallback(() => {
    store.shell.openModal({name: 'waitlist'})
  }, [store])

  return (
    <CenteredView style={[styles.container, pal.view]}>
      <View testID="noSessionView" style={[styles.containerInner, pal.border]}>
        <ErrorBoundary>
          <Text style={styles.title}>Bluesky</Text>
          <Text style={styles.subtitle}>See what's next</Text>
          <View testID="signinOrCreateAccount" style={styles.btns}>
            <TouchableOpacity
              testID="createAccountButton"
              style={[styles.btn, {backgroundColor: colors.blue3}]}
              onPress={onPressCreateAccount}>
              <Text style={[s.white, styles.btnLabel]}>
                Create a new account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="signInButton"
              style={[styles.btn, pal.btn]}
              onPress={onPressSignin}>
              <Text style={[pal.text, styles.btnLabel]}>Sign in</Text>
            </TouchableOpacity>
          </View>
          <Text
            type="xl"
            style={[styles.notice, pal.textLight]}
            lineHeight={1.3}>
            Bluesky will launch soon.{' '}
            <TouchableOpacity onPress={onPressWaitlist}>
              <Text type="xl" style={pal.link}>
                Join the waitlist
              </Text>
            </TouchableOpacity>{' '}
            to try the beta before it's publicly available.
          </Text>
        </ErrorBoundary>
      </View>
    </CenteredView>
  )
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  containerInner: {
    borderBottomWidth: 1,
    paddingVertical: 40,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  title: {
    textAlign: 'center',
    color: colors.blue3,
    fontSize: 68,
    fontWeight: 'bold',
    paddingBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.gray5,
    fontSize: 52,
    fontWeight: 'bold',
    paddingBottom: 30,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  btn: {
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginHorizontal: 10,
    minWidth: 220,
  },
  btnLabel: {
    textAlign: 'center',
    fontSize: 18,
  },
  notice: {
    paddingHorizontal: 40,
    textAlign: 'center',
  },
})
