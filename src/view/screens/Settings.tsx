import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  useFocusEffect,
  useNavigation,
  StackActions,
} from '@react-navigation/native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import * as AppInfo from 'lib/app-info'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {ScrollView} from '../com/util/Views'
import {ViewHeader} from '../com/util/ViewHeader'
import {Link} from '../com/util/Link'
import {Text} from '../com/util/text/Text'
import * as Toast from '../com/util/Toast'
import {UserAvatar} from '../com/util/UserAvatar'
import {DropdownButton} from 'view/com/util/forms/DropdownButton'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {AccountData} from 'state/models/session'
import {useAnalytics} from 'lib/analytics'
import {NavigationProp} from 'lib/routes/types'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Settings'>
export const SettingsScreen = observer(function Settings({}: Props) {
  const theme = useTheme()
  const pal = usePalette('default')
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()
  const {screen, track} = useAnalytics()
  const [isSwitching, setIsSwitching] = React.useState(false)

  useFocusEffect(
    React.useCallback(() => {
      screen('Settings')
      store.shell.setMinimalShellMode(false)
    }, [screen, store]),
  )

  const onPressSwitchAccount = async (acct: AccountData) => {
    track('Settings:SwitchAccountButtonClicked')
    setIsSwitching(true)
    if (await store.session.resumeSession(acct)) {
      setIsSwitching(false)
      navigation.navigate('HomeTab')
      navigation.dispatch(StackActions.popToTop())
      Toast.show(`Signed in as ${acct.displayName || acct.handle}`)
      return
    }
    setIsSwitching(false)
    Toast.show('Sorry! We need you to enter your password.')
    navigation.navigate('HomeTab')
    navigation.dispatch(StackActions.popToTop())
    store.session.clear()
  }
  const onPressAddAccount = () => {
    track('Settings:AddAccountButtonClicked')
    store.session.clear()
  }
  const onPressChangeHandle = () => {
    track('Settings:ChangeHandleButtonClicked')
    store.shell.openModal({
      name: 'change-handle',
      onChanged() {
        setIsSwitching(true)
        store.session.reloadFromServer().then(
          () => {
            setIsSwitching(false)
            Toast.show('Your handle has been updated')
          },
          err => {
            store.log.error(
              'Failed to reload from server after handle update',
              {err},
            )
            setIsSwitching(false)
          },
        )
      },
    })
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
        <View style={styles.spacer20} />
        <View style={[s.flexRow, styles.heading]}>
          <Text type="xl-bold" style={pal.text}>
            Signed in as
          </Text>
          <View style={s.flex1} />
        </View>
        {isSwitching ? (
          <View style={[pal.view, styles.linkCard]}>
            <ActivityIndicator />
          </View>
        ) : (
          <Link
            href={`/profile/${store.me.handle}`}
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
                onPress={isSwitching ? undefined : onPressSignout}>
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
            }>
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
          testID="switchToNewAccountBtn"
          style={[styles.linkCard, pal.view, isSwitching && styles.dimmed]}
          onPress={isSwitching ? undefined : onPressAddAccount}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="plus"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            Add account
          </Text>
        </TouchableOpacity>

        <View style={styles.spacer20} />

        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          Advanced
        </Text>
        <TouchableOpacity
          testID="changeHandleBtn"
          style={[styles.linkCard, pal.view, isSwitching && styles.dimmed]}
          onPress={isSwitching ? undefined : onPressChangeHandle}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="at"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            Change my handle
          </Text>
        </TouchableOpacity>

        <View style={styles.spacer20} />

        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          Danger zone
        </Text>
        <TouchableOpacity
          style={[pal.view, styles.linkCard]}
          onPress={onPressDeleteAccount}>
          <View
            style={[
              styles.iconContainer,
              theme.colorScheme === 'dark'
                ? styles.trashIconContainerDark
                : styles.trashIconContainerLight,
            ]}>
            <FontAwesomeIcon
              icon={['far', 'trash-can']}
              style={
                theme.colorScheme === 'dark'
                  ? styles.dangerDark
                  : styles.dangerLight
              }
              size={21}
            />
          </View>
          <Text
            type="lg"
            style={
              theme.colorScheme === 'dark'
                ? styles.dangerDark
                : styles.dangerLight
            }>
            Delete my account
          </Text>
        </TouchableOpacity>

        <View style={styles.spacer20} />

        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          Developer tools
        </Text>
        <Link
          style={[pal.view, styles.linkCardNoIcon]}
          href="/sys/log"
          title="System log">
          <Text type="lg" style={pal.text}>
            System log
          </Text>
        </Link>
        <Link
          style={[pal.view, styles.linkCardNoIcon]}
          href="/sys/debug"
          title="Debug tools">
          <Text type="lg" style={pal.text}>
            Storybook
          </Text>
        </Link>
        <Text type="sm" style={[styles.buildInfo, pal.textLight]}>
          Build version {AppInfo.appVersion} ({AppInfo.buildVersion})
        </Text>
        <View style={s.footerSpacer} />
      </ScrollView>
    </View>
  )
})

function AccountDropdownBtn({handle}: {handle: string}) {
  const store = useStores()
  const items = [
    {
      label: 'Remove account',
      onPress: () => {
        store.session.removeAccount(handle)
        Toast.show('Account removed from quick access')
      },
    },
  ]
  return (
    <View style={s.pl10}>
      <DropdownButton type="bare" items={items}>
        <FontAwesomeIcon icon="ellipsis-h" />
      </DropdownButton>
    </View>
  )
}

const styles = StyleSheet.create({
  dimmed: {
    opacity: 0.5,
  },
  spacer20: {
    height: 20,
  },
  heading: {
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  profile: {
    flexDirection: 'row',
    marginVertical: 6,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 1,
  },
  linkCardNoIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 1,
  },
  avi: {
    marginRight: 12,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 12,
  },
  trashIconContainerDark: {
    backgroundColor: colors.red7,
  },
  trashIconContainerLight: {
    backgroundColor: colors.red1,
  },
  dangerLight: {
    color: colors.red4,
  },
  dangerDark: {
    color: colors.red2,
  },
  buildInfo: {
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
})
