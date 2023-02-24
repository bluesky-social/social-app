import React, {useEffect} from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {observer} from 'mobx-react-lite'
import * as AppInfo from 'lib/app-info'
import {useStores} from 'state/index'
import {ScreenParams} from '../routes'
import {s} from 'lib/styles'
import {ScrollView} from '../com/util/Views'
import {ViewHeader} from '../com/util/ViewHeader'
import {Link} from '../com/util/Link'
import {Text} from '../com/util/text/Text'
import * as Toast from '../com/util/Toast'
import {UserAvatar} from '../com/util/UserAvatar'
import {usePalette} from 'lib/hooks/usePalette'
import {AccountData} from 'state/models/session'
import {useAnalytics} from 'lib/analytics'

export const Settings = observer(function Settings({
  navIdx,
  visible,
}: ScreenParams) {
  const pal = usePalette('default')
  const store = useStores()
  const {screen, track} = useAnalytics()
  const [isSwitching, setIsSwitching] = React.useState(false)

  useEffect(() => {
    screen('Settings')
  }, [screen])

  useEffect(() => {
    if (!visible) {
      return
    }
    store.shell.setMinimalShellMode(false)
    store.nav.setTitle(navIdx, 'Settings')
  }, [visible, store, navIdx])

  const onPressSwitchAccount = async (acct: AccountData) => {
    track('Settings:SwitchAccountButtonClicked')
    setIsSwitching(true)
    if (await store.session.resumeSession(acct)) {
      setIsSwitching(false)
      store.nav.tab.fixedTabReset()
      Toast.show(`Signed in as ${acct.displayName || acct.handle}`)
      return
    }
    setIsSwitching(false)
    Toast.show('Sorry! We need you to enter your password.')
    store.nav.tab.fixedTabReset()
    store.session.clear()
  }
  const onPressAddAccount = () => {
    track('Settings:AddAccountButtonClicked')
    store.session.clear()
  }
  const onPressSignout = () => {
    track('Settings:SignOutButtonClicked')
    store.session.logout()
  }
  const onPressDeleteAccount = () => {
    store.shell.openModal({name: 'delete-account'})
  }

  return (
    <View style={[s.hContentRegion]} testID="settingsScreen">
      <ViewHeader title="Settings" />
      <ScrollView style={s.hContentRegion}>
        <View style={[s.mt10, s.pl10, s.pr10]}>
          <View style={[s.flexRow]}>
            <Text type="xl-bold" style={pal.text}>
              Signed in as
            </Text>
            <View style={s.flex1} />
            <TouchableOpacity
              testID="signOutBtn"
              onPress={isSwitching ? undefined : onPressSignout}>
              <Text type="xl-medium" style={pal.link}>
                Sign out
              </Text>
            </TouchableOpacity>
          </View>
          {isSwitching ? (
            <View style={[pal.view, styles.profile]}>
              <ActivityIndicator />
            </View>
          ) : (
            <Link
              href={`/profile/${store.me.handle}`}
              title="Your profile"
              noFeedback>
              <View style={[pal.view, styles.profile]}>
                <UserAvatar
                  size={40}
                  displayName={store.me.displayName}
                  handle={store.me.handle || ''}
                  avatar={store.me.avatar}
                />
                <View style={[s.ml10]}>
                  <Text type="xl-bold" style={pal.text}>
                    {store.me.displayName || store.me.handle}
                  </Text>
                  <Text style={pal.textLight}>@{store.me.handle}</Text>
                </View>
              </View>
            </Link>
          )}
          <Text type="sm-medium" style={pal.text}>
            Switch to:
          </Text>
          {store.session.switchableAccounts.map(account => (
            <TouchableOpacity
              testID={`switchToAccountBtn-${account.handle}`}
              key={account.did}
              style={[
                pal.view,
                styles.profile,
                s.mb2,
                isSwitching && styles.dimmed,
              ]}
              onPress={
                isSwitching ? undefined : () => onPressSwitchAccount(account)
              }>
              <UserAvatar
                size={40}
                displayName={account.displayName}
                handle={account.handle || ''}
                avatar={account.aviUrl}
              />
              <View style={[s.ml10]}>
                <Text type="xl-bold" style={pal.text}>
                  {account.displayName || account.handle}
                </Text>
                <Text style={pal.textLight}>@{account.handle}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            testID="switchToNewAccountBtn"
            style={[
              pal.view,
              styles.profile,
              styles.alignCenter,
              s.mb2,
              isSwitching && styles.dimmed,
            ]}
            onPress={isSwitching ? undefined : onPressAddAccount}>
            <FontAwesomeIcon icon="plus" />
            <View style={[s.ml5]}>
              <Text type="md-medium" style={pal.text}>
                Add account
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.spacer} />
          <Text type="sm-medium" style={[s.mb5]}>
            Danger zone
          </Text>
          <TouchableOpacity
            style={[pal.view, s.p10, s.mb10]}
            onPress={onPressDeleteAccount}>
            <Text style={pal.textLight}>Delete my account</Text>
          </TouchableOpacity>
          <Text type="sm-medium" style={[s.mt10, s.mb5]}>
            Developer tools
          </Text>
          <Link
            style={[pal.view, s.p10, s.mb2]}
            href="/sys/log"
            title="System log">
            <Text style={pal.textLight}>System log</Text>
          </Link>
          <Link
            style={[pal.view, s.p10, s.mb2]}
            href="/sys/debug"
            title="Debug tools">
            <Text style={pal.textLight}>Storybook</Text>
          </Link>
          <Text type="sm" style={[s.mt10, pal.textLight]}>
            Build version {AppInfo.appVersion} ({AppInfo.buildVersion})
          </Text>
          <View style={s.footerSpacer} />
        </View>
      </ScrollView>
    </View>
  )
})

const styles = StyleSheet.create({
  dimmed: {
    opacity: 0.5,
  },
  spacer: {
    height: 50,
  },
  alignCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 14,
  },
  profile: {
    flexDirection: 'row',
    marginVertical: 6,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  avi: {
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 8,
  },
})
