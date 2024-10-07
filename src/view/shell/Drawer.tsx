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
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'

import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {usePalette} from '#/lib/hooks/usePalette'
import {getTabState, TabState} from '#/lib/routes/helpers'
import {NavigationProp} from '#/lib/routes/types'
import {colors, s} from '#/lib/styles'
import {useTheme} from '#/lib/ThemeContext'
import {isWeb} from '#/platform/detection'
import {emitSoftReset} from '#/state/events'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {SessionAccount, useSession} from '#/state/session'
import {useSetDrawerOpen} from '#/state/shell'
import {formatCount} from '#/view/com/util/numeric/format'
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {NavSignupCard} from '#/view/shell/NavSignupCard'
import {atoms as a} from '#/alf'
import {useTheme as useAlfTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {
  Bell_Filled_Corner0_Rounded as BellFilled,
  Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell'
import {BulletList_Stroke2_Corner0_Rounded as List} from '#/components/icons/BulletList'
import {
  Hashtag_Filled_Corner0_Rounded as HashtagFilled,
  Hashtag_Stroke2_Corner0_Rounded as Hashtag,
} from '#/components/icons/Hashtag'
import {
  HomeOpen_Filled_Corner0_Rounded as HomeFilled,
  HomeOpen_Stoke2_Corner0_Rounded as Home,
} from '#/components/icons/HomeOpen'
import {MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled} from '#/components/icons/MagnifyingGlass'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as MagnifyingGlass} from '#/components/icons/MagnifyingGlass2'
import {Message_Stroke2_Corner0_Rounded as Message} from '#/components/icons/Message'
import {SettingsGear2_Stroke2_Corner0_Rounded as Settings} from '#/components/icons/SettingsGear2'
import {
  UserCircle_Filled_Corner0_Rounded as UserCircleFilled,
  UserCircle_Stroke2_Corner0_Rounded as UserCircle,
} from '#/components/icons/UserCircle'
import {TextLink} from '../com/util/Link'

const iconWidth = 28

let DrawerProfileCard = ({
  account,
  onPressProfile,
}: {
  account: SessionAccount
  onPressProfile: () => void
}): React.ReactNode => {
  const {_, i18n} = useLingui()
  const pal = usePalette('default')
  const {data: profile} = useProfileQuery({did: account.did})

  return (
    <TouchableOpacity
      testID="profileCardButton"
      accessibilityLabel={_(msg`Profile`)}
      accessibilityHint={_(msg`Navigates to your profile`)}
      onPress={onPressProfile}>
      <UserAvatar
        size={80}
        avatar={profile?.avatar}
        // See https://github.com/bluesky-social/social-app/pull/1801:
        usePlainRNImage={true}
        type={profile?.associated?.labeler ? 'labeler' : 'user'}
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
      <View
        style={[
          styles.profileCardFollowers,
          a.gap_xs,
          a.flex_row,
          a.align_center,
          a.flex_wrap,
        ]}>
        <Text type="xl" style={pal.textLight}>
          <Trans>
            <Text type="xl-medium" style={pal.text}>
              {formatCount(i18n, profile?.followersCount ?? 0)}
            </Text>{' '}
            <Plural
              value={profile?.followersCount || 0}
              one="follower"
              other="followers"
            />
          </Trans>
        </Text>
        <Text type="xl" style={pal.textLight}>
          &middot;
        </Text>
        <Text type="xl" style={pal.textLight}>
          <Trans>
            <Text type="xl-medium" style={pal.text}>
              {formatCount(i18n, profile?.followsCount ?? 0)}
            </Text>{' '}
            <Plural
              value={profile?.followsCount || 0}
              one="following"
              other="following"
            />
          </Trans>
        </Text>
      </View>
    </TouchableOpacity>
  )
}
DrawerProfileCard = React.memo(DrawerProfileCard)
export {DrawerProfileCard}

let DrawerContent = ({}: {}): React.ReactNode => {
  const theme = useTheme()
  const t = useAlfTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
  const {isAtHome, isAtSearch, isAtFeeds, isAtNotifications, isAtMyProfile} =
    useNavigationTabState()
  const {hasSession, currentAccount} = useSession()
  const kawaii = useKawaiiMode()

  // events
  // =

  const onPressTab = React.useCallback(
    (tab: string) => {
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
          // @ts-ignore must be Home, Search, Notifications, or MyProfile
          navigation.navigate(`${tab}Tab`)
        }
      }
    },
    [navigation, setDrawerOpen, currentAccount],
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

  const onPressMyFeeds = React.useCallback(() => {
    navigation.navigate('Feeds')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen])

  const onPressLists = React.useCallback(() => {
    navigation.navigate('Lists')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen])

  const onPressSettings = React.useCallback(() => {
    navigation.navigate('Settings')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen])

  const onPressFeedback = React.useCallback(() => {
    Linking.openURL(
      FEEDBACK_FORM_URL({
        email: currentAccount?.email,
        handle: currentAccount?.handle,
      }),
    )
  }, [currentAccount])

  const onPressHelp = React.useCallback(() => {
    Linking.openURL(HELP_DESK_URL)
  }, [])

  // rendering
  // =

  return (
    <View
      testID="drawer"
      style={[
        styles.view,
        theme.colorScheme === 'light' ? pal.view : t.atoms.bg_contrast_25,
      ]}>
      <SafeAreaView style={s.flex1}>
        <ScrollView style={styles.main}>
          {hasSession && currentAccount ? (
            <View style={{}}>
              <DrawerProfileCard
                account={currentAccount}
                onPressProfile={onPressProfile}
              />
            </View>
          ) : (
            <View style={{paddingRight: 20}}>
              <NavSignupCard />
            </View>
          )}

          {hasSession ? (
            <>
              <View style={{height: 16}} />
              <SearchMenuItem isActive={isAtSearch} onPress={onPressSearch} />
              <HomeMenuItem isActive={isAtHome} onPress={onPressHome} />
              <NotificationsMenuItem
                isActive={isAtNotifications}
                onPress={onPressNotifications}
              />
              <FeedsMenuItem isActive={isAtFeeds} onPress={onPressMyFeeds} />
              <ListsMenuItem onPress={onPressLists} />
              <ProfileMenuItem
                isActive={isAtMyProfile}
                onPress={onPressProfile}
              />
              <SettingsMenuItem onPress={onPressSettings} />
            </>
          ) : (
            <>
              <HomeMenuItem isActive={isAtHome} onPress={onPressHome} />
              <FeedsMenuItem isActive={isAtFeeds} onPress={onPressMyFeeds} />
              <SearchMenuItem isActive={isAtSearch} onPress={onPressSearch} />
            </>
          )}

          <View style={styles.smallSpacer} />

          <View style={[{flexWrap: 'wrap', gap: 12}, s.flexCol]}>
            <TextLink
              type="md"
              style={pal.link}
              href="https://bsky.social/about/support/tos"
              text={_(msg`Terms of Service`)}
            />
            <TextLink
              type="md"
              style={pal.link}
              href="https://bsky.social/about/support/privacy-policy"
              text={_(msg`Privacy Policy`)}
            />
            {kawaii && (
              <Text type="md" style={pal.textLight}>
                Logo by{' '}
                <TextLink
                  type="md"
                  href="/profile/sawaratsuki.bsky.social"
                  text="@sawaratsuki.bsky.social"
                  style={pal.link}
                />
              </Text>
            )}
          </View>

          <View style={styles.smallSpacer} />
          <View style={styles.smallSpacer} />
        </ScrollView>

        <DrawerFooter
          onPressFeedback={onPressFeedback}
          onPressHelp={onPressHelp}
        />
      </SafeAreaView>
    </View>
  )
}
DrawerContent = React.memo(DrawerContent)
export {DrawerContent}

let DrawerFooter = ({
  onPressFeedback,
  onPressHelp,
}: {
  onPressFeedback: () => void
  onPressHelp: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  return (
    <View style={styles.footer}>
      <Button
        label={_(msg`Send feedback`)}
        size="small"
        variant="solid"
        color="secondary"
        onPress={onPressFeedback}>
        <ButtonIcon icon={Message} position="left" />
        <ButtonText>
          <Trans>Feedback</Trans>
        </ButtonText>
      </Button>
      <Button
        label={_(msg`Get help`)}
        size="small"
        variant="outline"
        color="secondary"
        onPress={onPressHelp}
        style={{
          backgroundColor: 'transparent',
        }}>
        <ButtonText>
          <Trans>Help</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}
DrawerFooter = React.memo(DrawerFooter)

interface MenuItemProps extends ComponentProps<typeof TouchableOpacity> {
  icon: JSX.Element
  label: string
  count?: string
  bold?: boolean
}

let SearchMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const pal = usePalette('default')
  return (
    <MenuItem
      icon={
        isActive ? (
          <MagnifyingGlassFilled
            style={pal.text as StyleProp<ViewStyle>}
            width={iconWidth}
          />
        ) : (
          <MagnifyingGlass
            style={pal.text as StyleProp<ViewStyle>}
            width={iconWidth}
          />
        )
      }
      label={_(msg`Search`)}
      accessibilityLabel={_(msg`Search`)}
      accessibilityHint=""
      bold={isActive}
      onPress={onPress}
    />
  )
}
SearchMenuItem = React.memo(SearchMenuItem)

let HomeMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const pal = usePalette('default')
  return (
    <MenuItem
      icon={
        isActive ? (
          <HomeFilled
            style={pal.text as StyleProp<ViewStyle>}
            width={iconWidth}
          />
        ) : (
          <Home style={pal.text as StyleProp<ViewStyle>} width={iconWidth} />
        )
      }
      label={_(msg`Home`)}
      accessibilityLabel={_(msg`Home`)}
      accessibilityHint=""
      bold={isActive}
      onPress={onPress}
    />
  )
}
HomeMenuItem = React.memo(HomeMenuItem)

let NotificationsMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const pal = usePalette('default')
  const numUnreadNotifications = useUnreadNotifications()
  return (
    <MenuItem
      icon={
        isActive ? (
          <BellFilled
            style={pal.text as StyleProp<ViewStyle>}
            width={iconWidth}
          />
        ) : (
          <Bell style={pal.text as StyleProp<ViewStyle>} width={iconWidth} />
        )
      }
      label={_(msg`Notifications`)}
      accessibilityLabel={_(msg`Notifications`)}
      accessibilityHint={
        numUnreadNotifications === ''
          ? ''
          : _(msg`${numUnreadNotifications} unread`)
      }
      count={numUnreadNotifications}
      bold={isActive}
      onPress={onPress}
    />
  )
}
NotificationsMenuItem = React.memo(NotificationsMenuItem)

let FeedsMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const pal = usePalette('default')
  return (
    <MenuItem
      icon={
        isActive ? (
          <HashtagFilled
            width={iconWidth}
            style={pal.text as FontAwesomeIconStyle}
          />
        ) : (
          <Hashtag width={iconWidth} style={pal.text as FontAwesomeIconStyle} />
        )
      }
      label={_(msg`Feeds`)}
      accessibilityLabel={_(msg`Feeds`)}
      accessibilityHint=""
      bold={isActive}
      onPress={onPress}
    />
  )
}
FeedsMenuItem = React.memo(FeedsMenuItem)

let ListsMenuItem = ({onPress}: {onPress: () => void}): React.ReactNode => {
  const {_} = useLingui()
  const pal = usePalette('default')
  return (
    <MenuItem
      icon={<List style={pal.text} width={iconWidth} />}
      label={_(msg`Lists`)}
      accessibilityLabel={_(msg`Lists`)}
      accessibilityHint=""
      onPress={onPress}
    />
  )
}
ListsMenuItem = React.memo(ListsMenuItem)

let ProfileMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const pal = usePalette('default')
  return (
    <MenuItem
      icon={
        isActive ? (
          <UserCircleFilled
            style={pal.text as StyleProp<ViewStyle>}
            width={iconWidth}
          />
        ) : (
          <UserCircle
            style={pal.text as StyleProp<ViewStyle>}
            width={iconWidth}
          />
        )
      }
      label={_(msg`Profile`)}
      accessibilityLabel={_(msg`Profile`)}
      accessibilityHint=""
      onPress={onPress}
    />
  )
}
ProfileMenuItem = React.memo(ProfileMenuItem)

let SettingsMenuItem = ({onPress}: {onPress: () => void}): React.ReactNode => {
  const {_} = useLingui()
  const pal = usePalette('default')
  return (
    <MenuItem
      icon={
        <Settings style={pal.text as StyleProp<ViewStyle>} width={iconWidth} />
      }
      label={_(msg`Settings`)}
      accessibilityLabel={_(msg`Settings`)}
      accessibilityHint=""
      onPress={onPress}
    />
  )
}
SettingsMenuItem = React.memo(SettingsMenuItem)

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
            <Text
              style={[styles.menuItemCountLabel, a.font_bold]}
              numberOfLines={1}>
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
    paddingHorizontal: 20,
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
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
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
    fontVariant: ['tabular-nums'],
    color: colors.white,
  },

  inviteCodes: {
    paddingLeft: 0,
    paddingVertical: 8,
    flexDirection: 'row',
  },
  inviteCodesIcon: {
    marginRight: 6,
    flexShrink: 0,
    marginTop: 2,
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
