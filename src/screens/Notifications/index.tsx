import {useCallback, useEffect, useEffectEvent, useRef, useState} from 'react'
import {View} from 'react-native'
import Animated, {
  interpolate,
  Reanimated3DefaultSpringConfig,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {LinearGradient} from 'expo-linear-gradient'
import {Trans, useLingui} from '@lingui/react/macro'
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {
  type NativeStackScreenProps,
  type NotificationsTabNavigatorParams,
} from '#/lib/routes/types'
import {emitSoftReset} from '#/state/events'
import {refreshGroupedNotifications} from '#/state/queries/notifications/grouped'
import {type GroupedNotificationsFeed} from '#/state/queries/notifications/grouped/types'
import {
  useUnreadNotifications,
  useUnreadNotificationsApi,
} from '#/state/queries/notifications/unread'
import {useShellHeaderLayout} from '#/state/shell/shell-layout'
import {
  HomeHeaderModeProvider,
  useHomeHeaderMode,
} from '#/view/com/util/MainScrollProvider'
import {NotificationsScreen as LegacyNotificationsScreen} from '#/view/screens/Notifications'
import {
  PageList,
  type PageLoad,
  type SeenAtMode,
} from '#/screens/Notifications/components/PageList'
import * as Pager from '#/screens/Notifications/components/PagerView'
import {TabPills} from '#/screens/Notifications/components/TabPills'
import {atoms as a, useBreakpoints, useTheme, utils} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {useAnalytics} from '#/analytics'
import {IS_LIQUID_GLASS, IS_WEB} from '#/env'

type Props = NativeStackScreenProps<
  NotificationsTabNavigatorParams,
  'Notifications'
>

export function NotificationsScreen(props: Props) {
  const ax = useAnalytics()
  const isNewNotificationsEnabled = ax.features.enabled(
    ax.features.NotificationsV2Enable,
  )

  if (isNewNotificationsEnabled) {
    return <NewNotificationsScreen {...props} />
  }

  return <LegacyNotificationsScreen {...props} />
}

export function NewNotificationsScreen({}: Props) {
  return (
    <Layout.Screen testID="newNotificationsScreen" noInsetTop={IS_LIQUID_GLASS}>
      <HomeHeaderModeProvider>
        <NewNotificationsScreenInner />
      </HomeHeaderModeProvider>
    </Layout.Screen>
  )
}

function NewNotificationsScreenInner() {
  const {t: l} = useLingui()
  const headerMode = useHomeHeaderMode()
  const initialHeaderOffset = useHeaderOffset()
  const [headerOffset, setHeaderOffset] = useState(initialHeaderOffset)
  const tabs: {key: GroupedNotificationsFeed; label: string}[] = [
    {key: 'all', label: l`All`},
    {key: 'people-i-follow', label: l`People you follow`},
    {key: 'followers', label: l`Followers`},
    {key: 'conversations', label: l`Replies`},
    {key: 'activity', label: l`Activity`},
  ]
  const {seenAt, onLoad, requestSnapshot, clearSeen} = useSessionSeenAt()
  const activeFeed = useRef<GroupedNotificationsFeed>(tabs[0].key)
  useReturnToScreen({
    activeFeed,
    requestSnapshot,
    clearSeen,
  })
  /*
   * With no notifications at all, every tab is empty, so the screen drops
   * the tabs and just shows the "All" tab's empty state.
   */
  const [hasNoNotifications, setHasNoNotifications] = useState(false)

  const showHeader = useCallback(() => {
    'worklet'
    headerMode.set(
      withSpring(0, {
        ...Reanimated3DefaultSpringConfig,
        overshootClamping: true,
      }),
    )
  }, [headerMode])

  useFocusEffect(
    useCallback(() => {
      return () => showHeader()
    }, [showHeader]),
  )

  return (
    <Pager.Root
      onPageSelected={page => {
        activeFeed.current = tabs[page].key
      }}
      onTabPressed={showHeader}
      onPageScrollStateChanged={state => {
        'worklet'
        if (state === 'dragging') {
          showHeader()
        }
      }}>
      <NotificationsHeader onHeightChange={setHeaderOffset}>
        {!hasNoNotifications && (
          <Pager.TabBar>
            {({selectedPage, selectPage, dragProgress}) => (
              <TabPills
                tabs={tabs}
                selectedTab={tabs[selectedPage].key}
                dragProgress={dragProgress}
                onSelectTab={tab => {
                  const page = tabs.findIndex(
                    candidate => candidate.key === tab,
                  )
                  // Re-pressing the current tab scrolls it to the top
                  if (page === selectedPage) {
                    emitSoftReset()
                  }
                  selectPage(page)
                }}
                contentContainerStyle={a.py_sm}
              />
            )}
          </Pager.TabBar>
        )}
      </NotificationsHeader>
      <Pager.Content
        manageDrawerGesture
        scrollEnabled={!hasNoNotifications}
        testID="notificationsPagerView">
        {tabs.map((tab, pageIndex) => (
          <PageList
            key={tab.key}
            feed={tab.key}
            pageIndex={pageIndex}
            headerOffset={headerOffset}
            seenAt={seenAt}
            onLoad={onLoad}
            requestSnapshot={requestSnapshot}
            onEmptyChange={
              tab.key === 'all' ? setHasNoNotifications : undefined
            }
          />
        ))}
      </Pager.Content>
    </Pager.Root>
  )
}

/**
 * Snapshot of when notifications were last seen, shared by every tab so the
 * unread tint stays put while the screen is open.
 *
 * The first tab to load takes the snapshot from the server, so anything new
 * since the last visit is tinted, and marks what it showed as seen. Later
 * loads update it according to the `SeenAtMode` they were requested with.
 */
function useSessionSeenAt() {
  const unreadApi = useUnreadNotificationsApi()
  const [seenAt, setSeenAt] = useState<Date>()
  /**
   * Which feed's next load should update the snapshot, and how. `'any'`
   * means whichever loads first; `null` means no update is wanted.
   */
  const pending = useRef<{
    feed: GroupedNotificationsFeed | 'any'
    mode: SeenAtMode
  } | null>({feed: 'any', mode: 'server'})

  const onLoad = ({feed, serverSeenAt, fetchedAt}: PageLoad) => {
    const request = pending.current
    if (!request || (request.feed !== 'any' && request.feed !== feed)) return
    pending.current = null
    if (request.mode === 'server') {
      setSeenAt(serverSeenAt ? new Date(serverSeenAt) : new Date(0))
    } else if (request.mode === 'cleared') {
      setSeenAt(new Date(fetchedAt))
    }
    void unreadApi.markAllRead({seenAt: new Date(fetchedAt)})
  }

  const requestSnapshot = (
    feed: GroupedNotificationsFeed,
    mode: SeenAtMode,
  ) => {
    pending.current = {feed, mode}
  }

  /**
   * Treats everything currently shown as seen.
   */
  const clearSeen = () => {
    setSeenAt(new Date())
  }

  return {seenAt, onLoad, requestSnapshot, clearSeen}
}

/**
 * Coming back to the screen after leaving it.
 *
 * - From a screen pushed within the Notifications tab (e.g. a post), the
 *   unread tint is kept as it was, and anything new is loaded and tinted too.
 * - After switching to another tab, what was already seen is no longer
 *   tinted, and anything that arrived meanwhile is loaded and tinted.
 */
function useReturnToScreen({
  activeFeed,
  requestSnapshot,
  clearSeen,
}: {
  activeFeed: React.RefObject<GroupedNotificationsFeed>
  requestSnapshot: (feed: GroupedNotificationsFeed, mode: SeenAtMode) => void
  clearSeen: () => void
}) {
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const numUnread = useUnreadNotifications()
  const isFocused = useIsFocused()

  /*
   * The tab navigator's own blur means the user switched tabs, rather than
   * pushing a screen within this tab's stack. Web's flat navigator has no tab
   * level, so it always behaves as within the stack.
   */
  const hasLeftTab = useRef(false)
  useEffect(() => {
    return navigation.getParent()?.addListener('blur', () => {
      hasLeftTab.current = true
    })
  }, [navigation])

  const onReturn = useEffectEvent(() => {
    const hasNew = numUnread !== ''
    const feed = activeFeed.current
    if (hasLeftTab.current) {
      hasLeftTab.current = false
      if (hasNew) {
        requestSnapshot(feed, 'server')
      } else {
        clearSeen()
      }
    } else if (hasNew) {
      requestSnapshot(feed, 'kept')
    }
    if (hasNew) {
      void refreshGroupedNotifications(queryClient, feed)
    }
  })

  const wasFocused = useRef(isFocused)
  useEffect(() => {
    if (isFocused && !wasFocused.current) {
      onReturn()
    }
    wasFocused.current = isFocused
  }, [isFocused])
}

function NotificationsHeader({
  children,
  onHeightChange,
}: {
  children: React.ReactNode
  onHeightChange: (height: number) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const headerMode = useHomeHeaderMode()
  /*
   * The pills move by the title's own height rather than the shell's, which
   * is shared with Home's taller header and can still hold its height.
   */
  const {height: titleHeight, onLayout: onTitleLayout} = useShellHeaderLayout()
  const {gtMobile} = useBreakpoints()
  const insets = useSafeAreaInsets()
  const headerPinnedHeight = IS_LIQUID_GLASS ? insets.top : 0

  const titleStyle = useAnimatedStyle(() => {
    const mode = headerMode.get()
    return {
      opacity: Math.pow(1 - mode, 2),
      pointerEvents: mode === 0 ? 'auto' : 'none',
    }
  })

  const pillsStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            headerMode.get(),
            [0, 1],
            [0, headerPinnedHeight - titleHeight.get()],
          ),
        },
      ],
    }
  })

  return (
    <View
      pointerEvents="box-none"
      style={[a.fixed, a.z_10, a.top_0, a.left_0, a.right_0]}
      onLayout={event => onHeightChange(event.nativeEvent.layout.height)}>
      {IS_LIQUID_GLASS ? (
        <LinearGradient
          key={t.name}
          pointerEvents="none"
          style={[a.absolute, a.inset_0]}
          start={[0.5, 0]}
          end={[0.5, 1]}
          colors={[
            t.atoms.bg.backgroundColor,
            utils.alpha(t.atoms.bg.backgroundColor, 0.8),
            utils.alpha(t.atoms.bg.backgroundColor, 0),
          ]}
        />
      ) : (
        <View
          pointerEvents="none"
          style={[a.absolute, a.inset_0, t.atoms.bg]}
        />
      )}
      {IS_WEB && gtMobile && (
        <Layout.Center
          pointerEvents="none"
          style={[
            a.absolute,
            a.inset_0,
            a.border_x,
            t.atoms.border_contrast_low,
            {maxWidth: Layout.CENTER_COLUMN_WIDTH + 2},
          ]}
        />
      )}
      <Animated.View
        style={[IS_LIQUID_GLASS && {paddingTop: insets.top}, titleStyle]}
        onLayout={onTitleLayout}>
        <Layout.Header.Outer noBottomBorder sticky={false}>
          <Layout.Header.MenuButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Notifications</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot>
            <Link
              to={{screen: 'NotificationSettings'}}
              label={l`Notification settings`}
              size="small"
              variant="ghost"
              color="secondary"
              shape="round"
              style={[a.justify_center]}>
              <ButtonIcon icon={SettingsIcon} size="lg" />
            </Link>
          </Layout.Header.Slot>
        </Layout.Header.Outer>
      </Animated.View>
      <Animated.View style={pillsStyle}>
        <Layout.Center>{children}</Layout.Center>
      </Animated.View>
    </View>
  )
}
