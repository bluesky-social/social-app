import {type JSX, useCallback} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {type BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {StackActions} from '@react-navigation/native'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {BOTTOM_BAR_AVI} from '#/lib/demo'
import {useHaptics} from '#/lib/haptics'
import {useDedupe} from '#/lib/hooks/useDedupe'
import {useHideBottomBarBorder} from '#/lib/hooks/useHideBottomBarBorder'
import {useMinimalShellFooterTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {clamp} from '#/lib/numbers'
import {getTabState, TabState} from '#/lib/routes/helpers'
import {type SharedNavTab, TAB_TO_NAV_ITEM} from '#/lib/routes/tab-to-nav-item'
import {emitSoftReset} from '#/state/events'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useUpdateAllRead} from '#/state/queries/messages/update-all-read'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useCloseAllActiveElements} from '#/state/util'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {SwitchAccountDialog} from '#/components/dialogs/SwitchAccount'
import {
  Bell_Filled_Corner0_Rounded as BellFilled,
  Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {
  HomeOpen_Filled_Corner0_Rounded as HomeFilled,
  HomeOpen_Stoke2_Corner0_Rounded as Home,
} from '#/components/icons/HomeOpen'
import {Inbox_Stroke2_Corner2_Rounded as InboxIcon} from '#/components/icons/Inbox'
import {
  MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled,
  MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass,
} from '#/components/icons/MagnifyingGlass'
import {
  Message_Stroke2_Corner0_Rounded as Message,
  Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message'
import * as Menu from '#/components/Menu'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {useActorStatus} from '#/features/liveNow'
import {useDemoMode} from '#/storage/hooks/demo-mode'
import {styles} from './BottomBarStyles'

export function BottomBar({navigation}: BottomTabBarProps) {
  const {hasSession, currentAccount} = useSession()
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const safeAreaInsets = useSafeAreaInsets()
  const {footerHeight} = useShellLayout()
  const {isAtHome, isAtSearch, isAtNotifications, isAtMyProfile, isAtMessages} =
    useNavigationTabState()
  const numUnreadNotifications = useUnreadNotifications()
  const numUnreadMessages = useUnreadMessageCount()
  const aa = useAgeAssurance()
  const footerMinimalShellTransform = useMinimalShellFooterTransform()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()
  const dedupe = useDedupe()
  const accountSwitchControl = useDialogControl()
  const messagesMenuControl = Menu.useMenuControl()
  const playHaptic = useHaptics()
  const hideBorder = useHideBottomBarBorder()
  const iconWidth = 28

  const showSignIn = useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  const showCreateAccount = useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
    // setShowLoggedOut(true)
  }, [requestSwitchToAccount, closeAllActiveElements])

  const onPressTab = useCallback(
    (tab: SharedNavTab) => {
      ax.metric('nav:click', {
        item: TAB_TO_NAV_ITEM[tab],
        surface: 'bottomBar',
      })
      const state = navigation.getState()
      const tabState = getTabState(state, tab)
      if (tabState === TabState.InsideAtRoot) {
        emitSoftReset()
      } else if (tabState === TabState.Inside) {
        // find the correct navigator in which to pop-to-top
        const target = state.routes.find(route => route.name === `${tab}Tab`)
          ?.state?.key
        dedupe(() => {
          if (target) {
            // if we found it, trigger pop-to-top
            navigation.dispatch({
              ...StackActions.popToTop(),
              target,
            })
          } else {
            // fallback: reset navigation
            navigation.reset({
              index: 0,
              routes: [{name: `${tab}Tab`}],
            })
          }
        })
      } else {
        dedupe(() => navigation.navigate(`${tab}Tab`))
      }
    },
    [navigation, dedupe, ax],
  )
  const onPressHome = useCallback(() => onPressTab('Home'), [onPressTab])
  const onPressSearch = useCallback(() => onPressTab('Search'), [onPressTab])
  const onPressNotifications = useCallback(
    () => onPressTab('Notifications'),
    [onPressTab],
  )
  const onPressProfile = useCallback(() => {
    onPressTab('MyProfile')
  }, [onPressTab])
  const onPressMessages = useCallback(() => {
    onPressTab('Messages')
  }, [onPressTab])

  const onLongPressProfile = useCallback(() => {
    playHaptic()
    accountSwitchControl.open()
  }, [accountSwitchControl, playHaptic])

  const onLongPressMessages = useCallback(() => {
    if (aa.flags.chatDisabled) return
    playHaptic()
    messagesMenuControl.open()
  }, [aa.flags.chatDisabled, messagesMenuControl, playHaptic])

  const [demoMode] = useDemoMode()
  const {isActive: live} = useActorStatus(profile)
  const isLabeler = profile?.associated?.labeler

  return (
    <>
      <SwitchAccountDialog control={accountSwitchControl} />
      <MessagesTabMenu control={messagesMenuControl} />
      <Animated.View
        style={[
          styles.bottomBar,
          t.atoms.bg,
          hideBorder
            ? {borderColor: t.atoms.bg.backgroundColor}
            : t.atoms.border_contrast_low,
          {paddingBottom: clamp(safeAreaInsets.bottom, 15, 60)},
          footerMinimalShellTransform,
        ]}
        onLayout={e => {
          footerHeight.set(e.nativeEvent.layout.height)
        }}>
        {hasSession ? (
          <>
            <Btn
              testID="bottomBarHomeBtn"
              icon={
                isAtHome ? (
                  <HomeFilled
                    width={iconWidth + 1}
                    style={[styles.ctrlIcon, t.atoms.text, styles.homeIcon]}
                  />
                ) : (
                  <Home
                    width={iconWidth + 1}
                    style={[styles.ctrlIcon, t.atoms.text, styles.homeIcon]}
                  />
                )
              }
              onPress={onPressHome}
              accessibilityRole="tab"
              accessibilityLabel={l`Home`}
              accessibilityHint=""
            />
            <Btn
              icon={
                isAtSearch ? (
                  <MagnifyingGlassFilled
                    width={iconWidth + 2}
                    style={[styles.ctrlIcon, t.atoms.text, styles.searchIcon]}
                  />
                ) : (
                  <MagnifyingGlass
                    testID="bottomBarSearchBtn"
                    width={iconWidth + 2}
                    style={[styles.ctrlIcon, t.atoms.text, styles.searchIcon]}
                  />
                )
              }
              onPress={onPressSearch}
              accessibilityRole="search"
              accessibilityLabel={l`Search`}
              accessibilityHint=""
            />
            <Btn
              testID="bottomBarMessagesBtn"
              icon={
                isAtMessages ? (
                  <MessageFilled
                    width={iconWidth - 1}
                    style={[styles.ctrlIcon, t.atoms.text, styles.feedsIcon]}
                  />
                ) : (
                  <Message
                    width={iconWidth - 1}
                    style={[styles.ctrlIcon, t.atoms.text, styles.feedsIcon]}
                  />
                )
              }
              onPress={onPressMessages}
              onLongPress={onLongPressMessages}
              notificationCount={
                aa.flags.chatDisabled ? undefined : numUnreadMessages.numUnread
              }
              hasNew={aa.flags.chatDisabled ? false : numUnreadMessages.hasNew}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={l`Chat`}
              accessibilityHint={
                !aa.flags.chatDisabled && numUnreadMessages.count > 0
                  ? l({
                      message: plural(numUnreadMessages.numUnread ?? 0, {
                        one: '# unread item',
                        other: '# unread items',
                      }),
                    })
                  : ''
              }
            />
            <Btn
              testID="bottomBarNotificationsBtn"
              icon={
                isAtNotifications ? (
                  <BellFilled
                    width={iconWidth}
                    style={[styles.ctrlIcon, t.atoms.text, styles.bellIcon]}
                  />
                ) : (
                  <Bell
                    width={iconWidth}
                    style={[styles.ctrlIcon, t.atoms.text, styles.bellIcon]}
                  />
                )
              }
              onPress={onPressNotifications}
              notificationCount={numUnreadNotifications}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={l`Notifications`}
              accessibilityHint={
                numUnreadNotifications === ''
                  ? ''
                  : l({
                      message: plural(numUnreadNotifications ?? 0, {
                        one: '# unread item',
                        other: '# unread items',
                      }),
                    })
              }
            />
            <Btn
              testID="bottomBarProfileBtn"
              icon={
                <View style={styles.ctrlIconSizingWrapper}>
                  <View
                    style={[
                      styles.ctrlIcon,
                      isLabeler ? styles.profileIconSquare : styles.profileIcon,
                      isAtMyProfile && [
                        isLabeler ? styles.onProfileSquare : styles.onProfile,
                        {
                          borderColor: t.atoms.text.color,
                          borderWidth: live ? 0 : 1,
                        },
                      ],
                    ]}>
                    <UserAvatar
                      avatar={demoMode ? BOTTOM_BAR_AVI : profile?.avatar}
                      size={iconWidth - (isAtMyProfile ? 3 : 2)}
                      // See https://github.com/bluesky-social/social-app/pull/1801:
                      usePlainRNImage={true}
                      type={profile?.associated?.labeler ? 'labeler' : 'user'}
                      live={live}
                      hideLiveBadge
                    />
                  </View>
                </View>
              }
              onPress={onPressProfile}
              onLongPress={onLongPressProfile}
              accessibilityRole="tab"
              accessibilityLabel={l`Profile`}
              accessibilityHint=""
            />
          </>
        ) : (
          <>
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 14,
                paddingBottom: 2,
                paddingLeft: 14,
                paddingRight: 6,
                gap: 8,
              }}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Logo width={28} />
                <View style={{paddingTop: 4}}>
                  <Logotype width={80} fill={t.atoms.text.color} />
                </View>
              </View>

              <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                <Button
                  onPress={showCreateAccount}
                  label={l`Create account`}
                  size="small"
                  color="primary">
                  <ButtonText>
                    <Trans>Create account</Trans>
                  </ButtonText>
                </Button>
                <Button
                  onPress={showSignIn}
                  label={l`Sign in`}
                  size="small"
                  color="secondary">
                  <ButtonText>
                    <Trans>Sign in</Trans>
                  </ButtonText>
                </Button>
              </View>
            </View>
          </>
        )}
      </Animated.View>
    </>
  )
}

interface BtnProps extends Pick<
  React.ComponentProps<typeof PressableScale>,
  | 'accessible'
  | 'accessibilityRole'
  | 'accessibilityHint'
  | 'accessibilityLabel'
> {
  testID?: string
  icon: JSX.Element
  notificationCount?: string
  hasNew?: boolean
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}

function Btn({
  testID,
  icon,
  hasNew,
  notificationCount,
  onPress,
  onLongPress,
  accessible,
  accessibilityHint,
  accessibilityLabel,
}: BtnProps) {
  const t = useTheme()

  return (
    <PressableScale
      testID={testID}
      style={[styles.ctrl, a.flex_1]}
      onPress={onPress}
      onLongPress={onLongPress}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      targetScale={0.8}
      accessibilityLargeContentTitle={accessibilityLabel}
      accessibilityShowsLargeContentViewer>
      {icon}
      {notificationCount ? (
        <View
          style={[
            styles.notificationCount,
            a.rounded_full,
            {backgroundColor: t.palette.primary_500},
          ]}>
          <Text
            style={styles.notificationCountLabel}
            maxFontSizeMultiplier={1.5}>
            {notificationCount}
          </Text>
        </View>
      ) : hasNew ? (
        <View
          style={[styles.hasNewBadge, {backgroundColor: t.palette.primary_500}]}
        />
      ) : null}
    </PressableScale>
  )
}

function MessagesTabMenu({control}: {control: Menu.MenuControlProps}) {
  const {t: l} = useLingui()

  const {mutate: markAllChatsRead} = useUpdateAllRead('accepted', {
    onMutate: () => {
      Toast.show(l`Marked all chats as read`, {type: 'success'})
    },
    onError: () => {
      Toast.show(l`Failed to mark all chats as read`, {type: 'error'})
    },
  })

  const {mutate: markAllRequestsRead} = useUpdateAllRead('request', {
    onMutate: () => {
      Toast.show(l`Marked all requests as read`, {type: 'success'})
    },
    onError: () => {
      Toast.show(l`Failed to mark all requests as read`, {type: 'error'})
    },
  })

  return (
    <Menu.Root control={control}>
      <Menu.Outer showCancel>
        <Menu.Group>
          <Menu.Item
            label={l`Mark all chats as read`}
            onPress={() => markAllChatsRead()}>
            <Menu.ItemIcon icon={CircleCheckIcon} />
            <Menu.ItemText>
              <Trans>Mark all chats as read</Trans>
            </Menu.ItemText>
          </Menu.Item>
          <Menu.Item
            label={l`Mark all requests as read`}
            onPress={() => markAllRequestsRead()}>
            <Menu.ItemIcon icon={InboxIcon} />
            <Menu.ItemText>
              <Trans>Mark all requests as read</Trans>
            </Menu.ItemText>
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
