import {useCallback, useEffect, useEffectEvent, useRef, useState} from 'react'
import {AppState, View} from 'react-native'
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
import {
  getGroupedNotificationsTop,
  type GroupedNotificationsFeed,
  type LoadedGroupedNotificationsPage,
  refreshGroupedNotifications,
} from '#/state/queries/notifications/grouped'
import {useUnreadNotificationsApi} from '#/state/queries/notifications/unread'
import {useShellHeaderLayout} from '#/state/shell/shell-layout'
import {
  HomeHeaderModeProvider,
  useHomeHeaderMode,
} from '#/view/com/util/MainScrollProvider'
import {NotificationsScreen as LegacyNotificationsScreen} from '#/view/screens/Notifications'
import {PageList} from '#/screens/Notifications/components/PageList'
import * as Pager from '#/screens/Notifications/components/PagerView'
import {TabPills} from '#/screens/Notifications/components/TabPills'
import {
  type FeedLoad,
  getMarkReadAt,
  nextSeenAt,
  type SeenAtMode,
} from '#/screens/Notifications/unread'
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
  const {seenAt, onFirstLoad, refresh} = useSessionSeenAt()
  const activeFeed = useRef<GroupedNotificationsFeed>(tabs[0].key)
  const scrolledDownFeeds = useRef(new Set<GroupedNotificationsFeed>())
  useReturnToScreen({
    activeFeed,
    scrolledDownFeeds,
    refresh,
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
            onFirstLoad={onFirstLoad}
            refresh={refresh}
            onScrolledDownChange={isScrolledDown => {
              if (isScrolledDown) {
                scrolledDownFeeds.current.add(tab.key)
              } else {
                scrolledDownFeeds.current.delete(tab.key)
              }
            }}
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
 * unread tint stays put while the screen is open, and the refreshes that
 * update it.
 *
 * Each feed's first load takes the snapshot from the server if there isn't
 * one yet. From then on, the feed's loads come from `refresh`, which updates
 * the snapshot according to its `SeenAtMode`. Only fresh loads count: a page
 * cached from before the screen mounted, or a refresh that failed, never
 * moves the snapshot or marks anything as seen.
 */
function useSessionSeenAt() {
  const queryClient = useQueryClient()
  const unreadApi = useUnreadNotificationsApi()
  const [seenAt, setSeenAt] = useState<Date>()
  const [mountedAt] = useState(() => Date.now())
  /**
   * Feeds whose first load has been applied, or whose loads `refresh` has
   * taken over.
   */
  const handledFeeds = useRef(new Set<GroupedNotificationsFeed>())
  /**
   * The latest refresh of each feed, so that one overtaken by another leaves
   * the load to it.
   */
  const latestRefreshes = useRef(new Map<GroupedNotificationsFeed, object>())

  const applyLoad = (load: FeedLoad, mode: SeenAtMode | undefined) => {
    setSeenAt(snapshot => nextSeenAt({load, mode, snapshot}))
    const markReadAt = getMarkReadAt(load)
    if (markReadAt) {
      void unreadApi.markAllRead({seenAt: markReadAt})
    }
  }

  const onFirstLoad = (
    feed: GroupedNotificationsFeed,
    page: LoadedGroupedNotificationsPage,
  ) => {
    if (handledFeeds.current.has(feed) || page.requestedAt < mountedAt) return
    handledFeeds.current.add(feed)
    applyLoad({feed, ...page}, undefined)
  }

  /**
   * Refetches the first page of a feed, then updates the snapshot from it.
   * Refreshing any other feed refreshes "All" behind it, so what's new is
   * marked as seen.
   */
  const refresh = async (feed: GroupedNotificationsFeed, mode?: SeenAtMode) => {
    handledFeeds.current.add(feed)
    const request = {}
    latestRefreshes.current.set(feed, request)
    const startedAt = Date.now()
    await refreshGroupedNotifications(queryClient, feed)
    if (latestRefreshes.current.get(feed) !== request) return
    const page = getGroupedNotificationsTop(queryClient, feed)
    // A failed refetch leaves the old page in place
    if (!page || page.requestedAt < startedAt) return
    applyLoad({feed, ...page}, mode)
    if (feed !== 'all') {
      void refresh('all')
    }
  }

  return {seenAt, onFirstLoad, refresh}
}

/**
 * Coming back to the screen: focusing it again, mounting it (web remounts
 * the screen on every visit), or bringing the app back to the foreground
 * while it's open. Each one asks the server for anything new and refreshes
 * the tab in view, unless the user is partway down it, in which case only
 * the unread check runs, so the list doesn't move under them.
 *
 * - From a screen pushed within the Notifications tab (e.g. a post), the
 *   unread tint is kept as it was, and anything new is tinted too.
 * - After switching to another tab or leaving the app, the tint is taken
 *   from the server again, so only what arrived meanwhile is tinted.
 */
function useReturnToScreen({
  activeFeed,
  scrolledDownFeeds,
  refresh,
}: {
  activeFeed: React.RefObject<GroupedNotificationsFeed>
  /**
   * Feeds whose list is scrolled down past the top.
   */
  scrolledDownFeeds: React.RefObject<Set<GroupedNotificationsFeed>>
  refresh: (feed: GroupedNotificationsFeed, mode: SeenAtMode) => Promise<void>
}) {
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const unreadApi = useUnreadNotificationsApi()
  const isFocused = useIsFocused()

  /*
   * The tab navigator's own blur means the user switched tabs, rather than
   * pushing a screen within this tab's stack. Web's flat navigator has no tab
   * level, so there only leaving the app counts.
   */
  const hasLeft = useRef(false)
  useEffect(() => {
    return navigation.getParent()?.addListener('blur', () => {
      hasLeft.current = true
    })
  }, [navigation])

  const onReturn = useEffectEvent(() => {
    const feed = activeFeed.current
    const mode = hasLeft.current ? 'server' : 'kept'
    hasLeft.current = false
    // Not loaded yet, so its first load is on the way
    if (!getGroupedNotificationsTop(queryClient, feed)) return
    if (scrolledDownFeeds.current.has(feed)) {
      void unreadApi.checkUnread()
    } else {
      void refresh(feed, mode)
    }
  })

  // Mounting counts, as the cache can outlive the screen
  const wasFocused = useRef(false)
  useEffect(() => {
    if (isFocused && !wasFocused.current) {
      onReturn()
    }
    wasFocused.current = isFocused
  }, [isFocused])

  const onForeground = useEffectEvent(() => {
    if (isFocused) {
      onReturn()
    }
  })
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        hasLeft.current = true
      } else if (state === 'active' && hasLeft.current) {
        onForeground()
      }
    })
    return () => subscription.remove()
  }, [])
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
