import {useCallback, useRef, useState} from 'react'
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
import {useFocusEffect} from '@react-navigation/native'

import {
  type NativeStackScreenProps,
  type NotificationsTabNavigatorParams,
} from '#/lib/routes/types'
import {emitSoftReset} from '#/state/events'
import {type GroupedNotificationsFeed} from '#/state/queries/notifications/grouped/types'
import {useUnreadNotificationsApi} from '#/state/queries/notifications/unread'
import {useShellHeaderLayout} from '#/state/shell/shell-layout'
import {
  HomeHeaderModeProvider,
  useHomeHeaderMode,
} from '#/view/com/util/MainScrollProvider'
import {NotificationsScreen as LegacyNotificationsScreen} from '#/view/screens/Notifications'
import {
  PageList,
  type PageLoad,
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
  const {seenAt, onLoad, requestSnapshot} = useSessionSeenAt()
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
 * The first tab to load takes the snapshot and marks everything it showed as
 * seen on the server. Refreshing a tab asks for a new snapshot from that
 * tab's next load.
 */
function useSessionSeenAt() {
  const unreadApi = useUnreadNotificationsApi()
  const [seenAt, setSeenAt] = useState<Date>()
  /**
   * Which feed's next load should take the snapshot: `'any'` for whichever
   * loads first, or `null` when no snapshot is wanted.
   */
  const snapshotFrom = useRef<GroupedNotificationsFeed | 'any' | null>('any')

  const onLoad = ({feed, serverSeenAt, fetchedAt}: PageLoad) => {
    const from = snapshotFrom.current
    if (from === null || (from !== 'any' && from !== feed)) return
    snapshotFrom.current = null
    setSeenAt(serverSeenAt ? new Date(serverSeenAt) : new Date(0))
    void unreadApi.markAllRead({seenAt: new Date(fetchedAt)})
  }

  const requestSnapshot = (feed: GroupedNotificationsFeed) => {
    snapshotFrom.current = feed
  }

  return {seenAt, onLoad, requestSnapshot}
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
