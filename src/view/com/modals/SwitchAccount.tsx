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
import {useAccountSwitcher} from 'lib/hooks/useAccountSwitcher'
import {UserAvatar} from '../util/UserAvatar'
import {AccountDropdownBtn} from '../util/AccountDropdownBtn'
import {Link} from '../util/Link'
import {makeProfileLink} from 'lib/routes/links'
import {BottomSheetScrollView} from '@gorhom/bottom-sheet'
import {Haptics} from 'lib/haptics'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export const snapPoints = ['40%', '90%']

export function Component({}: {}) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const {_: _lingui} = useLingui()

  const store = useStores()
  const [isSwitching, _, onPressSwitchAccount] = useAccountSwitcher()

  React.useEffect(() => {
    Haptics.default()
  })

  const onPressSignout = React.useCallback(() => {
    track('Settings:SignOutButtonClicked')
    store.session.logout()
  }, [track, store])

  return (
    <BottomSheetScrollView
      style={[styles.container, pal.view]}
      contentContainerStyle={[styles.innerContainer, pal.view]}>
      <Text type="title-xl" style={[styles.title, pal.text]}>
        <Trans>Switch Account</Trans>
      </Text>
      {isSwitching ? (
        <View style={[pal.view, styles.linkCard]}>
          <ActivityIndicator />
        </View>
      ) : (
        <Link href={makeProfileLink(store.me)} title="Your profile" noFeedback>
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
              accessibilityLabel={_lingui(msg`Sign out`)}
              accessibilityHint={`Signs ${store.me.displayName} out of Bluesky`}>
              <Text type="lg" style={pal.link}>
                <Trans>Sign out</Trans>
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
    </BottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    paddingBottom: 40,
  },
  title: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
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
