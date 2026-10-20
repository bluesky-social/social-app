import {useCallback, useRef, useState} from 'react'
import {type LayoutChangeEvent, View} from 'react-native'
import Animated, {
  interpolate,
  Reanimated3DefaultSpringConfig,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {LinearGradient} from 'expo-linear-gradient'
import {Trans, useLingui} from '@lingui/react/macro'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {HITSLOP_10} from '#/lib/constants'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {
  type NativeStackScreenProps,
  type NotificationsTabNavigatorParams,
} from '#/lib/routes/types'
import {emitSoftReset} from '#/state/events'
import {
  getGroupedNotificationsTop,
  type GroupedNotificationsFeed,
  type GroupedNotificationsPeek,
  type LoadedGroupedNotificationsPage,
  peekGroupedNotifications,
  refreshGroupedNotifications,
} from '#/state/queries/notifications/grouped'
import {useUnreadNotificationsApi} from '#/state/queries/notifications/unread'
import {useAppviewClient} from '#/state/session'
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
  type RefreshReason,
  useReturnToScreen,
} from '#/screens/Notifications/returnToScreen'
import {createTabTaps} from '#/screens/Notifications/tabTaps'
import {
  type FeedLoad,
  getMarkReadAt,
  nextSeenAt,
} from '#/screens/Notifications/unread'
import {atoms as a, useBreakpoints, useTheme, utils} from '#/alf'
import {BetaTag} from '#/components/BetaTag'
import {ButtonIcon} from '#/components/Button'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {type Metrics, useAnalytics} from '#/analytics'
import {Features, isOnForBetaUser} from '#/analytics/features'
import {IS_INTERNAL, IS_LIQUID_GLASS, IS_WEB} from '#/env'

type Props = NativeStackScreenProps<
  NotificationsTabNavigatorParams,
  'Notifications'
>

export function NotificationsScreen(props: Props) {
  const ax = useAnalytics()
  // Dev and TestFlight builds always get it, so it's dogfooded before rollout
  const isNewNotificationsEnabled =
    IS_INTERNAL || ax.features.enabled(ax.features.NotificationsV2Enable)

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
  const ax = useAnalytics()
  const navigation = useNavigation()
  const headerMode = useHomeHeaderMode()
  const initialHeaderOffset = useHeaderOffset()
  const [headerOffset, setHeaderOffset] = useState(initialHeaderOffset)
  /*
   * The title's own height, rather than the shell's, which is shared with
   * Home's taller header and can still hold its height.
   */
  const {height: titleHeight, onLayout: onTitleLayout} = useShellHeaderLayout()
  const tabs: {key: GroupedNotificationsFeed; label: string}[] = [
    {key: 'all', label: l`All`},
    {key: 'people-i-follow', label: l`People I follow`},
    {key: 'conversations', label: l`Replies`},
    {key: 'followers', label: l`Follows`},
    {key: 'activity', label: l`Activity`},
  ]
  const {seenAt, onFirstLoad, refresh} = useSessionSeenAt()
  const activeFeed = useRef<GroupedNotificationsFeed>(tabs[0].key)
  const scrolledDownFeeds = useRef(new Set<GroupedNotificationsFeed>())
  const queryClient = useQueryClient()
  const client = useAppviewClient()
  /*
   * Tabs that were never opened have nothing loaded, and are left to load
   * fresh when they first are.
   */
  const isLoaded = (feed: GroupedNotificationsFeed) =>
    !!getGroupedNotificationsTop(queryClient, feed)
  const [peeks, setPeeks] = useState<
    Partial<Record<GroupedNotificationsFeed, GroupedNotificationsPeek>>
  >({})
  const peekingFeeds = useRef(new Set<GroupedNotificationsFeed>())
  /**
   * Asks the server whether a loaded feed has anything newer than its first
   * page, which offers the "Refresh" pill if so. It never moves anything, so
   * it's how a tab the user has switched to, or is partway down, catches up.
   */
  const peekLatest = async (feed: GroupedNotificationsFeed) => {
    // One on its way answers for this one too, e.g. flicking between tabs
    if (!isLoaded(feed) || peekingFeeds.current.has(feed)) return
    peekingFeeds.current.add(feed)
    try {
      const peek = await peekGroupedNotifications(client, feed)
      setPeeks(current => ({...current, [feed]: peek}))
    } catch {
      // It only offers the pill, so a failed peek is left to the next one
    } finally {
      peekingFeeds.current.delete(feed)
    }
  }
  /**
   * Tabs brought along while out of view, which refresh in the background
   * when they're next opened, rather than straight away, since many won't be.
   */
  const staleFeeds = useRef(new Set<GroupedNotificationsFeed>())
  /**
   * Brings the other loaded tabs along, after the tab in view (`feed`) has
   * refreshed or been peeked. Refreshing "All" brings every other tab along,
   * and refreshing any other tab brings "All" along. `everyTab` brings them
   * all along, whichever tab is in view.
   *
   * They're marked stale, to refresh when next opened, except that with
   * `markRead`, "All" refreshes straight away, to mark what it loads as seen,
   * so a refresh on any tab clears the unread badge. Tabs the user is partway
   * down are left as they are, and get the pill when they're next in view.
   */
  const bringAlong = (
    feed: GroupedNotificationsFeed,
    {everyTab, markRead}: {everyTab: boolean; markRead: boolean},
  ) => {
    for (const {key: other} of tabs) {
      if (
        other === feed ||
        !isLoaded(other) ||
        scrolledDownFeeds.current.has(other) ||
        (!everyTab && feed !== 'all' && other !== 'all')
      ) {
        continue
      }
      if (other === 'all' && markRead) {
        staleFeeds.current.delete(other)
        void refresh(other, {isBehind: true})
      } else {
        staleFeeds.current.add(other)
      }
    }
  }
  /**
   * Refreshes the tab in view, as the user asked for or came back to, and
   * brings the others along. "All" marks what it loads as seen, so a refresh
   * on any tab clears the unread badge, while the snapshot keeps what's new
   * in "All" tinted until the next refresh.
   */
  const refreshTab = async (
    feed: GroupedNotificationsFeed,
    {everyTab = false}: {everyTab?: boolean} = {},
  ) => {
    /*
     * One after the other: if "All" marked what it loads as seen first,
     * `feed` would take its snapshot from after that, clearing the tint from
     * what "All" just loaded before anyone saw it
     */
    staleFeeds.current.delete(feed)
    // One that failed, or was overtaken, leaves the others to the next
    if (await refresh(feed)) {
      bringAlong(feed, {everyTab, markRead: true})
    }
  }
  /**
   * Brings the tab in view up to date as the user comes back to it, see
   * `useReturnToScreen`. It refreshes, unless the user is partway down it,
   * in which case it's only peeked, so the list doesn't move under them. A
   * significant return to the app, or opening a push, brings every tab along.
   *
   * On web, a `'focus'` return passes `isScrolledDown` from the real window
   * position, rather than leaving this to read `scrolledDownFeeds`, which
   * starts empty after a remount; see `useReturnToScreen`.
   */
  const checkLatest = (
    feed: GroupedNotificationsFeed,
    reason: RefreshReason,
    {isScrolledDown}: {isScrolledDown?: boolean} = {},
  ) => {
    const everyTab = reason === 'significantReturn' || reason === 'pushOpened'
    // Not loaded yet, so its first load is on the way
    if (!isLoaded(feed)) {
      if (everyTab) {
        bringAlong(feed, {everyTab, markRead: false})
      }
      return
    }
    if (!(isScrolledDown ?? scrolledDownFeeds.current.has(feed))) {
      ax.metric('notifications:refresh', {tab: feed, reason})
      void refreshTab(feed, {everyTab})
      return
    }
    void peekLatest(feed)
    if (everyTab) {
      // Nothing new has been seen on the tab in view, so nothing is marked
      bringAlong(feed, {everyTab, markRead: false})
    }
  }
  useReturnToScreen({
    activeFeed,
    checkLatest,
    peekLatest: feed => void peekLatest(feed),
    scrolledDownFeeds,
  })
  /*
   * With no notifications at all, every tab is empty, so the screen drops
   * the tabs and just shows the "All" tab's empty state.
   */
  const [hasNoNotifications, setHasNoNotifications] = useState(false)
  /**
   * Pages loading what's new after the tab button or a pill was pressed, so
   * the header can show it for the page in view, as v1 did.
   */
  const [loadingLatestPages, setLoadingLatestPages] = useState<
    ReadonlySet<number>
  >(() => new Set())

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

  const logTabDisplayed = (
    page: number,
    reason: Metrics['notifications:tabDisplayed']['reason'],
  ) => {
    ax.metric('notifications:tabDisplayed', {
      tab: tabs[page].key,
      index: page,
      reason,
    })
  }
  useFocusEffect(
    useNonReactiveCallback(() => {
      logTabDisplayed(
        tabs.findIndex(tab => tab.key === activeFeed.current),
        'focus',
      )
    }),
  )
  const [tabTaps] = useState(createTabTaps)

  return (
    <Pager.Root
      onPageSelected={page => {
        const feed = tabs[page].key
        const isTap = tabTaps.take(page)
        // Web reports the page it starts on, too
        if (feed === activeFeed.current) return
        activeFeed.current = feed
        logTabDisplayed(page, isTap ? 'tap' : 'swipe')
        /*
         * Switching tabs never clears what's tinted. A tab brought along by
         * a refresh elsewhere catches up in the background, once. Otherwise
         * it only peeks for anything new, which the "Refresh" pill offers,
         * so flicking between tabs doesn't reload them
         */
        if (staleFeeds.current.delete(feed)) {
          void refresh(feed, {isBehind: true}).then(didLoad => {
            // Left stale, to try again next time
            if (!didLoad) staleFeeds.current.add(feed)
          })
        } else {
          void peekLatest(feed)
        }
      }}
      onTabPressed={showHeader}
      onPageScrollStateChanged={state => {
        'worklet'
        if (state === 'dragging') {
          showHeader()
        }
      }}>
      <NotificationsHeader
        titleHeight={titleHeight}
        onTitleLayout={onTitleLayout}
        onHeightChange={setHeaderOffset}
        loadingLatestPages={loadingLatestPages}>
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
                  } else {
                    tabTaps.tap(page)
                  }
                  selectPage(page)
                }}
                contentContainerStyle={IS_WEB ? a.pb_sm : a.py_sm}
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
            titleHeight={titleHeight}
            seenAt={seenAt}
            onFirstLoad={onFirstLoad}
            refresh={feed => refreshTab(feed)}
            peek={peeks[tab.key]}
            onLoadingLatestChange={isLoading => {
              setLoadingLatestPages(pages => {
                const next = new Set(pages)
                if (isLoading) {
                  next.add(pageIndex)
                } else {
                  next.delete(pageIndex)
                }
                return next
              })
            }}
            onScrolledDownChange={isScrolledDown => {
              /*
               * On web, a screen left under another stays mounted but
               * hidden, which the list reports as scrolled down. Coming back
               * would then only peek, so a tab keeps the state it was left in
               */
              if (!navigation.isFocused()) return
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
 * one yet. From then on, the feed's loads come from `refresh`, which takes
 * the snapshot from the server when the user asked for it, clearing what was
 * tinted before. Only fresh loads count: a page cached from before the
 * screen mounted, or a refresh that failed, never moves the snapshot or marks
 * anything as seen.
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
   * The refresh of each feed that's on its way, so that one overtaken by
   * another leaves the load to it.
   */
  const latestRefreshes = useRef(new Map<GroupedNotificationsFeed, object>())

  const applyLoad = (load: FeedLoad, isRefresh: boolean) => {
    setSeenAt(snapshot => nextSeenAt({load, isRefresh, snapshot}))
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
    applyLoad({feed, ...page}, false)
  }

  /**
   * Refetches the first page of a feed. A refresh the user asked for takes
   * the snapshot from it, clearing what was tinted before. One in the
   * background (`isBehind`) leaves the snapshot alone, so what it loads is
   * tinted like the rest. Either way, a load of "All" marks what it shows as
   * seen. Resolves with whether it loaded the feed, rather than failing or
   * leaving it to another refresh.
   */
  const refresh = async (
    feed: GroupedNotificationsFeed,
    {isBehind = false}: {isBehind?: boolean} = {},
  ): Promise<boolean> => {
    /*
     * One already on its way loads the feed anyway. Overtaking it would
     * cancel its refetch, and if the user asked for it, keep it from taking
     * the snapshot
     */
    if (isBehind && latestRefreshes.current.has(feed)) return false
    handledFeeds.current.add(feed)
    const request = {}
    latestRefreshes.current.set(feed, request)
    const startedAt = Date.now()
    await refreshGroupedNotifications(queryClient, feed)
    if (latestRefreshes.current.get(feed) !== request) return false
    latestRefreshes.current.delete(feed)
    const page = getGroupedNotificationsTop(queryClient, feed)
    // A failed refetch leaves the old page in place
    if (!page || page.requestedAt < startedAt) return false
    applyLoad({feed, ...page}, !isBehind)
    return true
  }

  return {seenAt, onFirstLoad, refresh}
}

function NotificationsHeader({
  children,
  titleHeight,
  onTitleLayout,
  onHeightChange,
  loadingLatestPages,
}: {
  children: React.ReactNode
  /**
   * The height of the title, which hides on scroll, as the pills move up by
   * it. See `useShellHeaderLayout`.
   */
  titleHeight: SharedValue<number>
  onTitleLayout: (event: LayoutChangeEvent) => void
  onHeightChange: (height: number) => void
  /**
   * Pages loading what's new, shown in place of the settings icon while the
   * page in view is one of them.
   */
  loadingLatestPages: ReadonlySet<number>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const headerMode = useHomeHeaderMode()
  const {selectedPage} = Pager.usePager()
  const {gtMobile} = useBreakpoints()
  const insets = useSafeAreaInsets()
  const headerPinnedHeight = IS_LIQUID_GLASS ? insets.top : 0

  const titleStyle = useAnimatedStyle(() => {
    if (IS_WEB) return {}
    const mode = headerMode.get()
    return {
      opacity: Math.pow(1 - mode, 2),
      pointerEvents: mode === 0 ? 'auto' : 'none',
    }
  })

  const pillsStyle = useAnimatedStyle(() => {
    if (IS_WEB) return {}
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

  const height = useSharedValue(0)
  const [pillsHeight, setPillsHeight] = useState(0)
  /*
   * Shrinks the fade from the top as the pills move up, so that it always
   * ends where they do. Scaling, rather than moving it, keeps its opaque top
   * behind the status bar and the pills
   */
  const fadeStyle = useAnimatedStyle(() => {
    const fullHeight = height.get()
    if (fullHeight === 0) return {}
    const shownHeight =
      fullHeight - headerMode.get() * (titleHeight.get() - headerPinnedHeight)
    return {transform: [{scaleY: shownHeight / fullHeight}]}
  })

  return (
    <View
      pointerEvents="box-none"
      style={[a.fixed, a.z_10, a.top_0, a.left_0, a.right_0]}
      onLayout={event => {
        height.set(event.nativeEvent.layout.height)
        onHeightChange(event.nativeEvent.layout.height)
      }}>
      {/*
       * On native, the background fades out under the header, down to the
       * bottom of the pills as they move up. On web, the title and the pills
       * each have their own background
       */}
      {!IS_WEB && (
        <Animated.View
          pointerEvents="none"
          style={[a.absolute, a.inset_0, {transformOrigin: 'top'}, fadeStyle]}>
          <HeaderFade
            /*
             * With the title hidden, the strong part reaches the middle of
             * the pills, below the status bar if there is one
             */
            midpoint={
              pillsHeight > 0
                ? (headerPinnedHeight + pillsHeight / 2) /
                  (headerPinnedHeight + pillsHeight)
                : undefined
            }
          />
        </Animated.View>
      )}
      <Animated.View
        style={[IS_LIQUID_GLASS && {paddingTop: insets.top}, titleStyle]}
        onLayout={onTitleLayout}>
        {IS_WEB && (
          <View
            pointerEvents="none"
            style={[a.absolute, a.inset_0, t.atoms.bg]}
          />
        )}
        <Layout.Header.Outer noBottomBorder sticky={false}>
          <Layout.Header.MenuButton />
          <Layout.Header.Content>
            <View style={[a.flex_row, a.align_center, a.gap_sm]}>
              <Layout.Header.TitleText>
                <Trans>Notifications</Trans>
              </Layout.Header.TitleText>
              {
                /*
                 * Only for those who have it because they opted in to beta
                 * features, not internal builds or a wider rollout
                 */
                isOnForBetaUser(Features.NotificationsV2Enable) && (
                  <Link
                    to={{screen: 'BetaFeaturesSettings'}}
                    label={l`Beta features`}
                    accessibilityHint={l`Opens your beta features settings`}
                    hitSlop={HITSLOP_10}>
                    <BetaTag />
                  </Link>
                )
              }
            </View>
          </Layout.Header.Content>
          <Layout.Header.Slot>
            <Link
              to={{screen: 'NotificationSettings'}}
              label={l`Notification settings`}
              size="small"
              variant="ghost"
              color="secondary"
              shape="round"
              // Ghost buttons fill with the screen colour, which shows on the see-through header
              style={[a.justify_center, a.bg_transparent]}>
              <ButtonIcon
                icon={
                  loadingLatestPages.has(selectedPage) ? Loader : SettingsIcon
                }
                size="lg"
              />
            </Link>
          </Layout.Header.Slot>
        </Layout.Header.Outer>
      </Animated.View>
      <Animated.View
        style={pillsStyle}
        onLayout={event => setPillsHeight(event.nativeEvent.layout.height)}>
        {IS_WEB && <HeaderFade />}
        <Layout.Center>{children}</Layout.Center>
      </Animated.View>
      {/* Last, so the backgrounds above don't cover it */}
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
    </View>
  )
}

/**
 * The header's background fading out to the bottom, so content scrolling
 * under it shows through.
 */
function HeaderFade({
  midpoint = 0.5,
}: {
  /**
   * How far down the fade is still strong, at 0.9 opacity, as a fraction of
   * its height. It fades out completely below that.
   */
  midpoint?: number
}) {
  const t = useTheme()
  return (
    <LinearGradient
      key={t.name}
      pointerEvents="none"
      style={[a.absolute, a.inset_0]}
      start={[0.5, 0]}
      end={[0.5, 1]}
      colors={[
        t.atoms.bg.backgroundColor,
        utils.alpha(t.atoms.bg.backgroundColor, 0.9),
        utils.alpha(t.atoms.bg.backgroundColor, 0),
      ]}
      locations={[0, midpoint, 1]}
    />
  )
}
