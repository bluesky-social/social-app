import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {Text} from '../util/text/Text'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {StackActions, useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {AccountData} from 'state/models/session'
import {reset as resetNavigation} from '../../../Navigation'
import * as Toast from '../../com/util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {AccountDropdownBtn} from '../util/AccountDropdownBtn'
import {Link} from '../util/Link'
import {makeProfileLink} from 'lib/routes/links'
import {BottomSheetScrollView} from '@gorhom/bottom-sheet'

export const snapPoints = ['40%', '90%']

export function Component({}: {}) {
  const pal = usePalette('default')
  const {track} = useAnalytics()

  const store = useStores()
  const [isSwitching, setIsSwitching] = React.useState(false)
  const navigation = useNavigation<NavigationProp>()

  const onPressSwitchAccount = React.useCallback(
    async (acct: AccountData) => {
      track('Settings:SwitchAccountButtonClicked')
      setIsSwitching(true)
      if (await store.session.resumeSession(acct)) {
        setIsSwitching(false)
        store.shell.closeModal()
        resetNavigation()
        Toast.show(`Signed in as ${acct.displayName || acct.handle}`)
        return
      }
      setIsSwitching(false)
      Toast.show('Sorry! We need you to enter your password.')
      navigation.navigate('HomeTab')
      navigation.dispatch(StackActions.popToTop())
      store.session.clear()
    },
    [track, setIsSwitching, navigation, store],
  )

  const onPressSignout = React.useCallback(() => {
    track('Settings:SignOutButtonClicked')
    store.session.logout()
  }, [track, store])

  const onCancel = () => {
    store.shell.closeModal()
  }

  return (
    <View style={[styles.container, pal.view]}>
      <BottomSheetScrollView
        style={styles.container}
        contentContainerStyle={[styles.innerContainer, pal.view]}>
        <Text type="title-xl" style={[styles.title, pal.text]}>
          Switch Account
        </Text>
        {isSwitching ? (
          <View style={[pal.view, styles.linkCard]}>
            <ActivityIndicator />
          </View>
        ) : (
          <Link
            href={makeProfileLink(store.me)}
            title="Your profile"
            noFeedback>
            <View style={[pal.view, styles.linkCard]}>
              <View style={styles.avi}>
                <UserAvatar size={40} avatar={store.me.avatar} />
              </View>
              <View style={[s.flex1]}>
                <Text type="md-bold" style={pal.text} numberOfLines={1}>
                  {store.me.displayName || store.me.handle}
                </Text>
                <Text type="sm" style={pal.textLight} numberOfLines={1}>
                  {store.me.handle}
                </Text>
              </View>
              <TouchableOpacity
                testID="signOutBtn"
                onPress={isSwitching ? undefined : onPressSignout}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                accessibilityHint={`Signs ${store.me.displayName} out of Bluesky`}>
                <Text type="lg" style={pal.link}>
                  Sign out
                </Text>
              </TouchableOpacity>
            </View>
          </Link>
        )}
        {store.session.switchableAccounts.map(account => (
          <TouchableOpacity
            testID={`switchToAccountBtn-${account.handle}`}
            key={account.did}
            style={[pal.view, styles.linkCard, isSwitching && styles.dimmed]}
            onPress={
              isSwitching ? undefined : () => onPressSwitchAccount(account)
            }
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${account.handle}`}
            accessibilityHint="Switches the account you are logged in to">
            <View style={styles.avi}>
              <UserAvatar size={40} avatar={account.aviUrl} />
            </View>
            <View style={[s.flex1]}>
              <Text type="md-bold" style={pal.text}>
                {account.displayName || account.handle}
              </Text>
              <Text type="sm" style={pal.textLight}>
                {account.handle}
              </Text>
            </View>
            <AccountDropdownBtn handle={account.handle} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.btn, s.mt10]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel switching account"
          accessibilityHint="Closes the modal and returns to the previous screen"
          onAccessibilityEscape={onCancel}>
          <Text type="button-lg" style={pal.textLight}>
            Cancel
          </Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    paddingBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    marginHorizontal: 20,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 1,
  },
  avi: {
    marginRight: 12,
  },
  dimmed: {
    opacity: 0.5,
  },
})
