import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {Text} from '../util/text/Text'
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
import {useSession, useSessionApi, SessionAccount} from '#/state/session'
import {useProfileQuery} from '#/state/queries/profile'
import {useCloseAllActiveElements} from '#/state/util'

export const snapPoints = ['40%', '90%']

function SwitchAccountCard({account}: {account: SessionAccount}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {track} = useAnalytics()
  const {isSwitchingAccounts, currentAccount} = useSession()
  const {logout} = useSessionApi()
  const {data: profile} = useProfileQuery({did: account.did})
  const isCurrentAccount = account.did === currentAccount?.did
  const {onPressSwitchAccount} = useAccountSwitcher()
  const closeAllActiveElements = useCloseAllActiveElements()

  const onPressSignout = React.useCallback(() => {
    track('Settings:SignOutButtonClicked')
    closeAllActiveElements()
    // needs to be in timeout or the modal re-opens
    setTimeout(() => logout(), 0)
  }, [track, logout, closeAllActiveElements])

  const contents = (
    <View style={[pal.view, styles.linkCard]}>
      <View style={styles.avi}>
        <UserAvatar size={40} avatar={profile?.avatar} />
      </View>
      <View style={[s.flex1]}>
        <Text type="md-bold" style={pal.text} numberOfLines={1}>
          {profile?.displayName || account?.handle}
        </Text>
        <Text type="sm" style={pal.textLight} numberOfLines={1}>
          {account?.handle}
        </Text>
      </View>

      {isCurrentAccount ? (
        <TouchableOpacity
          testID="signOutBtn"
          onPress={isSwitchingAccounts ? undefined : onPressSignout}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Sign out`)}
          accessibilityHint={_(
            msg`Signs ${profile?.displayName} out of Bluesky`,
          )}>
          <Text type="lg" style={pal.link}>
            <Trans>Sign out</Trans>
          </Text>
        </TouchableOpacity>
      ) : (
        <AccountDropdownBtn account={account} />
      )}
    </View>
  )

  return isCurrentAccount ? (
    <Link
      href={makeProfileLink({
        did: currentAccount.did,
        handle: currentAccount.handle,
      })}
      title={_(msg`Your profile`)}
      noFeedback>
      {contents}
    </Link>
  ) : (
    <TouchableOpacity
      testID={`switchToAccountBtn-${account.handle}`}
      key={account.did}
      style={[isSwitchingAccounts && styles.dimmed]}
      onPress={
        isSwitchingAccounts ? undefined : () => onPressSwitchAccount(account)
      }
      accessibilityRole="button"
      accessibilityLabel={_(msg`Switch to ${account.handle}`)}
      accessibilityHint={_(msg`Switches the account you are logged in to`)}>
      {contents}
    </TouchableOpacity>
  )
}

export function Component({}: {}) {
  const pal = usePalette('default')
  const {isSwitchingAccounts, currentAccount, accounts} = useSession()

  React.useEffect(() => {
    Haptics.default()
  })

  return (
    <BottomSheetScrollView
      style={[styles.container, pal.view]}
      contentContainerStyle={[styles.innerContainer, pal.view]}>
      <Text type="title-xl" style={[styles.title, pal.text]}>
        <Trans>Switch Account</Trans>
      </Text>

      {isSwitchingAccounts || !currentAccount ? (
        <View style={[pal.view, styles.linkCard]}>
          <ActivityIndicator />
        </View>
      ) : (
        <SwitchAccountCard account={currentAccount} />
      )}

      {accounts
        .filter(a => a.did !== currentAccount?.did)
        .map(account => (
          <SwitchAccountCard key={account.did} account={account} />
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
