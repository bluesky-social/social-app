import React, {ComponentProps} from 'react'
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {useNavigation, StackActions} from '@react-navigation/native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useQueryClient} from '@tanstack/react-query'
import {s, colors} from 'lib/styles'
import {FEEDBACK_FORM_URL, HELP_DESK_URL} from 'lib/constants'
import {
  HomeIcon,
  HomeIconSolid,
  BellIcon,
  BellIconSolid,
  UserIcon,
  CogIcon,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
  UserIconSolid,
  HashtagIcon,
  ListIcon,
  HandIcon,
} from 'lib/icons'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Text} from 'view/com/util/text/Text'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {pluralize} from 'lib/strings/helpers'
import {getTabState, TabState} from 'lib/routes/helpers'
import {NavigationProp} from 'lib/routes/types'
import {useNavigationTabState} from 'lib/hooks/useNavigationTabState'
import {isWeb} from 'platform/detection'
import {formatCount, formatCountShortOnly} from 'view/com/util/numeric/format'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSetDrawerOpen} from '#/state/shell'
import {useModalControls} from '#/state/modals'
import {useSession, SessionAccount} from '#/state/session'
import {useProfileQuery} from '#/state/queries/profile'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {emitSoftReset} from '#/state/events'
import {useInviteCodesQuery} from '#/state/queries/invites'
import {RQKEY as NOTIFS_RQKEY} from '#/state/queries/notifications/feed'

export function DrawerProfileCard({
  account,
  onPressProfile,
}: {
  account: SessionAccount
  onPressProfile: () => void
}) {
  const {_} = useLingui()
  const pal = usePalette('default')
  const {data: profile} = useProfileQuery({did: account.did})

  return (
    <TouchableOpacity
      testID="profileCardButton"
      accessibilityLabel={_(msg`Profile`)}
      accessibilityHint="Navigates to your profile"
      onPress={onPressProfile}>
      <UserAvatar
        size={80}
        avatar={profile?.avatar}
        // See https://github.com/bluesky-social/social-app/pull/1801:
        usePlainRNImage={true}
      />
      <Text
        type="title-lg"
        style={[pal.text, s.bold, styles.profileCardDisplayName]}
        numberOfLines={1}>
        {profile?.displayName || account.handle}
      </Text>
      <Text
        type="2xl"
        style={[pal.textLight, styles.profileCardHandle]}
        numberOfLines={1}>
        @{account.handle}
      </Text>
      <Text type="xl" style={[pal.textLight, styles.profileCardFollowers]}>
        <Text type="xl-medium" style={pal.text}>
          {formatCountShortOnly(profile?.followersCount ?? 0)}
        </Text>{' '}
        {pluralize(profile?.followersCount || 0, 'follower')} &middot;{' '}
        <Text type="xl-medium" style={pal.text}>
          {formatCountShortOnly(profile?.followsCount ?? 0)}
        </Text>{' '}
        following
      </Text>
    </TouchableOpacity>
  )
}

export function DrawerContent() {
  const theme = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
  const {track} = useAnalytics()
  const {isAtHome, isAtSearch, isAtFeeds, isAtNotifications, isAtMyProfile} =
    useNavigationTabState()
  const {currentAccount} = useSession()
  const numUnreadNotifications = useUnreadNotifications()

  // events
  // =

  const onPressTab = React.useCallback(
    (tab: string) => {
      track('Menu:ItemClicked', {url: tab})
      const state = navigation.getState()
      setDrawerOpen(false)
      if (isWeb) {
        // hack because we have flat navigator for web and MyProfile does not exist on the web navigator -ansh
        if (tab === 'MyProfile') {
          navigation.navigate('Profile', {name: currentAccount!.handle})
        } else {
          // @ts-ignore must be Home, Search, Notifications, or MyProfile
          navigation.navigate(tab)
        }
      } else {
        const tabState = getTabState(state, tab)
        if (tabState === TabState.InsideAtRoot) {
          emitSoftReset()
        } else if (tabState === TabState.Inside) {
          navigation.dispatch(StackActions.popToTop())
        } else {
          if (tab === 'Notifications') {
            // fetch new notifs on view
            queryClient.invalidateQueries({
              queryKey: NOTIFS_RQKEY(),
            })
          }
          // @ts-ignore must be Home, Search, Notifications, or MyProfile
          navigation.navigate(`${tab}Tab`)
        }
      }
    },
    [track, navigation, setDrawerOpen, currentAccount, queryClient],
  )

  const onPressHome = React.useCallback(() => onPressTab('Home'), [onPressTab])

  const onPressSearch = React.useCallback(
    () => onPressTab('Search'),
    [onPressTab],
  )

  const onPressNotifications = React.useCallback(
    () => onPressTab('Notifications'),
    [onPressTab],
  )

  const onPressProfile = React.useCallback(() => {
    onPressTab('MyProfile')
  }, [onPressTab])

  const onPressMyFeeds = React.useCallback(
    () => onPressTab('Feeds'),
    [onPressTab],
  )

  const onPressLists = React.useCallback(() => {
    track('Menu:ItemClicked', {url: 'Lists'})
    navigation.navigate('Lists')
    setDrawerOpen(false)
  }, [navigation, track, setDrawerOpen])

  const onPressModeration = React.useCallback(() => {
    track('Menu:ItemClicked', {url: 'Moderation'})
    navigation.navigate('Moderation')
    setDrawerOpen(false)
  }, [navigation, track, setDrawerOpen])

  const onPressSettings = React.useCallback(() => {
    track('Menu:ItemClicked', {url: 'Settings'})
    navigation.navigate('Settings')
    setDrawerOpen(false)
  }, [navigation, track, setDrawerOpen])

  const onPressFeedback = React.useCallback(() => {
    track('Menu:FeedbackClicked')
    Linking.openURL(
      FEEDBACK_FORM_URL({
        email: currentAccount?.email,
        handle: currentAccount?.handle,
      }),
    )
  }, [track, currentAccount])

  const onPressHelp = React.useCallback(() => {
    track('Menu:HelpClicked')
    Linking.openURL(HELP_DESK_URL)
  }, [track])

  // rendering
  // =

  return (
    <View
      testID="drawer"
      style={[
        styles.view,
        theme.colorScheme === 'light' ? pal.view : styles.viewDarkMode,
      ]}>
      <SafeAreaView style={s.flex1}>
        <ScrollView style={styles.main}>
          <View style={{}}>
            {currentAccount && (
              <DrawerProfileCard
                account={currentAccount}
                onPressProfile={onPressProfile}
              />
            )}
          </View>

          <InviteCodes style={{paddingLeft: 0}} />

          <View style={{height: 10}} />

          <MenuItem
            icon={
              isAtSearch ? (
                <MagnifyingGlassIcon2Solid
                  style={pal.text as StyleProp<ViewStyle>}
                  size={24}
                  strokeWidth={1.7}
                />
              ) : (
                <MagnifyingGlassIcon2
                  style={pal.text as StyleProp<ViewStyle>}
                  size={24}
                  strokeWidth={1.7}
                />
              )
            }
            label="Search"
            accessibilityLabel={_(msg`Search`)}
            accessibilityHint=""
            bold={isAtSearch}
            onPress={onPressSearch}
          />
          <MenuItem
            icon={
              isAtHome ? (
                <HomeIconSolid
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={3.25}
                />
              ) : (
                <HomeIcon
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={3.25}
                />
              )
            }
            label="Home"
            accessibilityLabel={_(msg`Home`)}
            accessibilityHint=""
            bold={isAtHome}
            onPress={onPressHome}
          />
          <MenuItem
            icon={
              isAtNotifications ? (
                <BellIconSolid
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={1.7}
                />
              ) : (
                <BellIcon
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={1.7}
                />
              )
            }
            label="Notifications"
            accessibilityLabel={_(msg`Notifications`)}
            accessibilityHint={
              numUnreadNotifications === ''
                ? ''
                : `${numUnreadNotifications} unread`
            }
            count={numUnreadNotifications}
            bold={isAtNotifications}
            onPress={onPressNotifications}
          />
          <MenuItem
            icon={
              isAtFeeds ? (
                <HashtagIcon
                  strokeWidth={3}
                  style={pal.text as FontAwesomeIconStyle}
                  size={24}
                />
              ) : (
                <HashtagIcon
                  strokeWidth={2}
                  style={pal.text as FontAwesomeIconStyle}
                  size={24}
                />
              )
            }
            label="Feeds"
            accessibilityLabel={_(msg`Feeds`)}
            accessibilityHint=""
            bold={isAtFeeds}
            onPress={onPressMyFeeds}
          />
          <MenuItem
            icon={<ListIcon strokeWidth={2} style={pal.text} size={26} />}
            label="Lists"
            accessibilityLabel={_(msg`Lists`)}
            accessibilityHint=""
            onPress={onPressLists}
          />
          <MenuItem
            icon={<HandIcon strokeWidth={5} style={pal.text} size={24} />}
            label="Moderation"
            accessibilityLabel={_(msg`Moderation`)}
            accessibilityHint=""
            onPress={onPressModeration}
          />
          <MenuItem
            icon={
              isAtMyProfile ? (
                <UserIconSolid
                  style={pal.text as StyleProp<ViewStyle>}
                  size="26"
                  strokeWidth={1.5}
                />
              ) : (
                <UserIcon
                  style={pal.text as StyleProp<ViewStyle>}
                  size="26"
                  strokeWidth={1.5}
                />
              )
            }
            label="Profile"
            accessibilityLabel={_(msg`Profile`)}
            accessibilityHint=""
            onPress={onPressProfile}
          />
          <MenuItem
            icon={
              <CogIcon
                style={pal.text as StyleProp<ViewStyle>}
                size="26"
                strokeWidth={1.75}
              />
            }
            label="Settings"
            accessibilityLabel={_(msg`Settings`)}
            accessibilityHint=""
            onPress={onPressSettings}
          />

          <View style={styles.smallSpacer} />
          <View style={styles.smallSpacer} />
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel={_(msg`Send feedback`)}
            accessibilityHint=""
            onPress={onPressFeedback}
            style={[
              styles.footerBtn,
              styles.footerBtnFeedback,
              theme.colorScheme === 'light'
                ? styles.footerBtnFeedbackLight
                : styles.footerBtnFeedbackDark,
            ]}>
            <FontAwesomeIcon
              style={pal.link as FontAwesomeIconStyle}
              size={18}
              icon={['far', 'message']}
            />
            <Text type="lg-medium" style={[pal.link, s.pl10]}>
              <Trans>Feedback</Trans>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel={_(msg`Send feedback`)}
            accessibilityHint=""
            onPress={onPressHelp}
            style={[styles.footerBtn]}>
            <Text type="lg-medium" style={[pal.link, s.pl10]}>
              <Trans>Help</Trans>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

interface MenuItemProps extends ComponentProps<typeof TouchableOpacity> {
  icon: JSX.Element
  label: string
  count?: string
  bold?: boolean
}

function MenuItem({
  icon,
  label,
  accessibilityLabel,
  count,
  bold,
  onPress,
}: MenuItemProps) {
  const pal = usePalette('default')
  return (
    <TouchableOpacity
      testID={`menuItemButton-${label}`}
      style={styles.menuItem}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="">
      <View style={[styles.menuItemIconWrapper]}>
        {icon}
        {count ? (
          <View
            style={[
              styles.menuItemCount,
              count.length > 2
                ? styles.menuItemCountHundreds
                : count.length > 1
                ? styles.menuItemCountTens
                : undefined,
            ]}>
            <Text style={styles.menuItemCountLabel} numberOfLines={1}>
              {count}
            </Text>
          </View>
        ) : undefined}
      </View>
      <Text
        type={bold ? '2xl-bold' : '2xl'}
        style={[pal.text, s.flex1]}
        numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function InviteCodes({style}: {style?: StyleProp<ViewStyle>}) {
  const {track} = useAnalytics()
  const setDrawerOpen = useSetDrawerOpen()
  const pal = usePalette('default')
  const {data: invites} = useInviteCodesQuery()
  const invitesAvailable = invites?.available?.length ?? 0
  const {openModal} = useModalControls()
  const onPress = React.useCallback(() => {
    track('Menu:ItemClicked', {url: '#invite-codes'})
    setDrawerOpen(false)
    openModal({name: 'invite-codes'})
  }, [openModal, track, setDrawerOpen])
  return (
    <TouchableOpacity
      testID="menuItemInviteCodes"
      style={[styles.inviteCodes, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        invitesAvailable === 1
          ? 'Invite codes: 1 available'
          : `Invite codes: ${invitesAvailable} available`
      }
      accessibilityHint="Opens list of invite codes">
      <FontAwesomeIcon
        icon="ticket"
        style={[
          styles.inviteCodesIcon,
          invitesAvailable > 0 ? pal.link : pal.textLight,
        ]}
        size={18}
      />
      <Text
        type="lg-medium"
        style={invitesAvailable > 0 ? pal.link : pal.textLight}>
        {formatCount(invitesAvailable)} invite{' '}
        {pluralize(invitesAvailable, 'code')}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    paddingBottom: 50,
    maxWidth: 300,
  },
  viewDarkMode: {
    backgroundColor: '#1B1919',
  },
  main: {
    paddingLeft: 20,
    paddingTop: 20,
  },
  smallSpacer: {
    height: 20,
  },

  profileCardDisplayName: {
    marginTop: 20,
    paddingRight: 30,
  },
  profileCardHandle: {
    marginTop: 4,
    paddingRight: 30,
  },
  profileCardFollowers: {
    marginTop: 16,
    paddingRight: 10,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 10,
  },
  menuItemIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemCount: {
    position: 'absolute',
    width: 'auto',
    right: -6,
    top: -4,
    backgroundColor: colors.blue3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 6,
  },
  menuItemCountTens: {
    width: 25,
  },
  menuItemCountHundreds: {
    right: -12,
    width: 34,
  },
  menuItemCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    color: colors.white,
  },

  inviteCodes: {
    paddingLeft: 22,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteCodesIcon: {
    marginRight: 6,
  },

  footer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
    paddingTop: 20,
    paddingLeft: 20,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 25,
  },
  footerBtnFeedback: {
    paddingHorizontal: 20,
  },
  footerBtnFeedbackLight: {
    backgroundColor: '#DDEFFF',
  },
  footerBtnFeedbackDark: {
    backgroundColor: colors.blue6,
  },
})
