import React, {ComponentProps} from 'react'
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'

import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {getTabState, TabState} from '#/lib/routes/helpers'
import {NavigationProp} from '#/lib/routes/types'
import {colors} from '#/lib/styles'
import {isWeb} from '#/platform/detection'
import {emitSoftReset} from '#/state/events'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {SessionAccount, useSession} from '#/state/session'
import {useSetDrawerOpen} from '#/state/shell'
import {formatCount} from '#/view/com/util/numeric/format'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {NavSignupCard} from '#/view/shell/NavSignupCard'
import {atoms as a} from '#/alf'
import {useTheme} from '#/alf'
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
import {
  Message_Stroke2_Corner0_Rounded as Message,
  Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message'
import {SettingsGear2_Stroke2_Corner0_Rounded as Settings} from '#/components/icons/SettingsGear2'
import {
  UserCircle_Filled_Corner0_Rounded as UserCircleFilled,
  UserCircle_Stroke2_Corner0_Rounded as UserCircle,
} from '#/components/icons/UserCircle'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

const iconWidth = 26

let DrawerProfileCard = ({
  account,
  onPressProfile,
}: {
  account: SessionAccount
  onPressProfile: () => void
}): React.ReactNode => {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const {data: profile} = useProfileQuery({did: account.did})

  return (
    <TouchableOpacity
      testID="profileCardButton"
      accessibilityLabel={_(msg`Profile`)}
      accessibilityHint={_(msg`Navigates to your profile`)}
      onPress={onPressProfile}
      style={[a.flex_col, a.gap_xs]}>
      <UserAvatar
        size={60}
        avatar={profile?.avatar}
        // See https://github.com/bluesky-social/social-app/pull/1801:
        usePlainRNImage={true}
        type={profile?.associated?.labeler ? 'labeler' : 'user'}
      />
      <Text style={[a.font_heavy, a.text_3xl, a.mt_2xs]} numberOfLines={1}>
        {profile?.displayName || account.handle}
      </Text>
      <Text style={[t.atoms.text_contrast_medium, a.text_md]} numberOfLines={1}>
        @{account.handle}
      </Text>
      <View
        style={[a.mt_md, a.gap_xs, a.flex_row, a.align_center, a.flex_wrap]}>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>
            <Text style={[a.text_md, a.font_bold]}>
              {formatCount(i18n, profile?.followersCount ?? 0)}
            </Text>{' '}
            <Plural
              value={profile?.followersCount || 0}
              one="follower"
              other="followers"
            />
          </Trans>
        </Text>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>&middot;</Text>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>
            <Text style={[a.text_md, a.font_bold]}>
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
  const t = useTheme()
  const {_} = useLingui()
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
  const {
    isAtHome,
    isAtSearch,
    isAtFeeds,
    isAtNotifications,
    isAtMyProfile,
    isAtMessages,
  } = useNavigationTabState()
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

  const onPressMessages = React.useCallback(
    () => onPressTab('Messages'),
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
        a.flex_1,
        a.pt_sm,
        a.pb_lg,
        t.scheme === 'light' ? t.atoms.bg : t.atoms.bg_contrast_25,
      ]}>
      <SafeAreaView style={[a.flex_1]}>
        <ScrollView
          style={[a.flex_1]}
          contentContainerStyle={[a.px_xl, a.pt_lg]}>
          {hasSession && currentAccount ? (
            <DrawerProfileCard
              account={currentAccount}
              onPressProfile={onPressProfile}
            />
          ) : (
            <View style={[a.pr_xl]}>
              <NavSignupCard />
            </View>
          )}

          {hasSession ? (
            <>
              <View style={{height: 16}} />
              <SearchMenuItem isActive={isAtSearch} onPress={onPressSearch} />
              <HomeMenuItem isActive={isAtHome} onPress={onPressHome} />
              <ChatMenuItem isActive={isAtMessages} onPress={onPressMessages} />
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

          <View style={[a.flex_col, a.gap_md, a.flex_wrap, a.my_xl]}>
            <InlineLinkText
              style={[a.text_md]}
              label={_(msg`Terms of Service`)}
              to="https://bsky.social/about/support/tos">
              <Trans>Terms of Service</Trans>
            </InlineLinkText>
            <InlineLinkText
              style={[a.text_md]}
              to="https://bsky.social/about/support/privacy-policy"
              label={_(msg`Privacy Policy`)}>
              <Trans>Privacy Policy</Trans>
            </InlineLinkText>
            {kawaii && (
              <Text style={t.atoms.text_contrast_medium}>
                <Trans>
                  Logo by{' '}
                  <InlineLinkText
                    style={[a.text_md]}
                    to="/profile/sawaratsuki.bsky.social"
                    label="@sawaratsuki.bsky.social">
                    @sawaratsuki.bsky.social
                  </InlineLinkText>
                </Trans>
              </Text>
            )}
          </View>
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
    <View style={[a.flex_row, a.gap_sm, a.flex_wrap, a.pl_xl, a.py_sm]}>
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

interface MenuItemProps extends ComponentProps<typeof PressableScale> {
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
  const t = useTheme()
  return (
    <MenuItem
      icon={
        isActive ? (
          <MagnifyingGlassFilled style={[t.atoms.text]} width={iconWidth} />
        ) : (
          <MagnifyingGlass style={[t.atoms.text]} width={iconWidth} />
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
  const t = useTheme()
  return (
    <MenuItem
      icon={
        isActive ? (
          <HomeFilled style={[t.atoms.text]} width={iconWidth} />
        ) : (
          <Home style={[t.atoms.text]} width={iconWidth} />
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

let ChatMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  return (
    <MenuItem
      icon={
        isActive ? (
          <MessageFilled style={[t.atoms.text]} width={iconWidth} />
        ) : (
          <Message style={[t.atoms.text]} width={iconWidth} />
        )
      }
      label={_(msg`Chats`)}
      accessibilityLabel={_(msg`Chats`)}
      accessibilityHint=""
      bold={isActive}
      onPress={onPress}
    />
  )
}
ChatMenuItem = React.memo(ChatMenuItem)

let NotificationsMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  const numUnreadNotifications = useUnreadNotifications()
  return (
    <MenuItem
      icon={
        isActive ? (
          <BellFilled style={[t.atoms.text]} width={iconWidth} />
        ) : (
          <Bell style={[t.atoms.text]} width={iconWidth} />
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
  const t = useTheme()
  return (
    <MenuItem
      icon={
        isActive ? (
          <HashtagFilled width={iconWidth} style={[t.atoms.text]} />
        ) : (
          <Hashtag width={iconWidth} style={[t.atoms.text]} />
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
  const t = useTheme()

  return (
    <MenuItem
      icon={<List style={[t.atoms.text]} width={iconWidth} />}
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
  const t = useTheme()
  return (
    <MenuItem
      icon={
        isActive ? (
          <UserCircleFilled style={[t.atoms.text]} width={iconWidth} />
        ) : (
          <UserCircle style={[t.atoms.text]} width={iconWidth} />
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
  const t = useTheme()
  return (
    <MenuItem
      icon={<Settings style={[t.atoms.text]} width={iconWidth} />}
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
  return (
    <PressableScale
      testID={`menuItemButton-${label}`}
      style={[a.flex_row, a.align_center, {paddingVertical: 14}]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint=""
      targetScale={0.95}>
      <View style={[styles.menuItemIconWrapper]}>
        {icon}
        {count ? (
          <View
            style={[
              styles.menuItemCount,
              a.rounded_full,
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
        style={[a.flex_1, a.text_2xl, bold && a.font_bold]}
        numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
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
})
