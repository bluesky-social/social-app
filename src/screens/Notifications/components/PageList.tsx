import {useEffect, useEffectEvent, useRef, useState} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {type SharedValue} from 'react-native-reanimated'
import {Trans, useLingui} from '@lingui/react/macro'
import {useIsFocused} from '@react-navigation/native'
import {isToday} from 'date-fns'

import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePostViewTracking} from '#/lib/hooks/usePostViewTracking'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {listenSoftReset} from '#/state/events'
import {
  type GroupedNotificationsFeed,
  type LoadedGroupedNotificationsPage,
  type NotificationView,
  useGroupedNotificationsQuery,
} from '#/state/queries/notifications/grouped'
import {useLastUnreadCheck} from '#/state/queries/notifications/unread'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List, type ListMethods} from '#/view/com/util/List'
import {NotificationFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {MainScrollProvider} from '#/view/com/util/MainScrollProvider'
import {
  FollowedYouHeader,
  FollowerNotification,
  type FollowerNotificationView,
  getFollowers,
  isFollowerNotification,
  NotificationItem,
} from '#/screens/Notifications/components/NotificationItem'
import {usePager} from '#/screens/Notifications/components/PagerView'
import {RefreshPill} from '#/screens/Notifications/components/RefreshPill'
import {
  isRefreshPillVisible,
  type SeenAtMode,
} from '#/screens/Notifications/unread'
import {atoms as a, useTheme} from '#/alf'
import {ButtonText} from '#/components/Button'
import {useIsFindContactsFeatureEnabledBasedOnGeolocation} from '#/components/contacts/country-allowlist'
import {EnvelopeNotification_Filled_Corner2_Rounded as EnvelopeNotificationIcon} from '#/components/icons/brands/EnvelopeNotification'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import type * as bsky from '#/types/bsky'

type Row =
  | {type: 'section'; key: string; section: 'today' | 'earlier'}
  | {type: 'notification'; key: string; notification: NotificationView}
  | {type: 'followersHeader'; key: string}
  | {
      type: 'follower'
      key: string
      notification: FollowerNotificationView
      profile: bsky.profile.AnyProfileView
    }
  | {type: 'loading'; key: string}
  | {type: 'empty'; key: string}
  | {type: 'error'; key: string}
  | {type: 'loadMoreError'; key: string}

/**
 * One tab of the notifications pager: the grouped notifications for `feed`,
 * split into "Today" and "Earlier", or as a list of people for "followers".
 */
export function PageList({
  feed,
  pageIndex,
  headerOffset,
  titleHeight,
  seenAt,
  onFirstLoad,
  refresh,
  onLoadingLatestChange,
  onScrolledDownChange,
  onEmptyChange,
}: {
  feed: GroupedNotificationsFeed
  pageIndex: number
  /**
   * The height of the screen's header, which the list starts beneath.
   */
  headerOffset: number
  /**
   * The height of the part of the header that hides on scroll.
   */
  titleHeight: SharedValue<number>
  /**
   * Snapshot of when notifications were last seen, shared by every tab so
   * the unread tint doesn't change while the screen is open.
   */
  seenAt?: Date
  /**
   * Called with the feed's first page whenever it changes, so the screen can
   * take its `seenAt` snapshot from the feed's first load.
   */
  onFirstLoad: (
    feed: GroupedNotificationsFeed,
    page: LoadedGroupedNotificationsPage,
  ) => void
  /**
   * Refetches the feed's first page, then updates the screen's `seenAt`
   * snapshot from it.
   */
  refresh: (feed: GroupedNotificationsFeed, mode: SeenAtMode) => Promise<void>
  /**
   * Called when loading what's new after the tab button or a pill was
   * pressed starts, and again when it settles, successfully or not.
   */
  onLoadingLatestChange?: (isLoading: boolean) => void
  onScrolledDownChange?: (isScrolledDown: boolean) => void
  /**
   * Called with whether this feed has loaded completely and has nothing in
   * it, e.g. so the screen can drop its tabs when there are no
   * notifications at all.
   */
  onEmptyChange?: (isEmpty: boolean) => void
}) {
  const {t: l} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const trackPostView = usePostViewTracking('Notifications')
  const isScreenFocused = useIsFocused()
  const isActive = usePager().selectedPage === pageIndex
  const bottomBarOffset = useBottomBarOffset()
  const [isPTRing, setIsPTRing] = useState(false)
  const [listHeight, setListHeight] = useState(0)

  // Don't fetch tabs until they've been opened
  const [hasBeenActive, setHasBeenActive] = useState(isActive)
  if (isActive && !hasBeenActive) {
    setHasBeenActive(true)
  }

  const {
    data,
    isFetched,
    isFetching,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useGroupedNotificationsQuery({feed, seenAt, enabled: hasBeenActive})

  const notifications = data?.pages.flatMap(page => page.notifications) ?? []

  const isEmpty =
    isFetched && !isError && notifications.length === 0 && !hasNextPage
  useEffect(() => {
    onEmptyChange?.(isEmpty)
  }, [isEmpty, onEmptyChange])

  const top = data?.pages[0]
  useEffect(() => {
    if (top) {
      onFirstLoad(feed, top)
    }
  }, [feed, top, onFirstLoad])

  /*
   * Pressing the Notifications tab button, the selected tab pill, or the
   * "Refresh" pill scrolls the visible tab back to the top and loads anything
   * new, keeping the unread tint. It always asks the server, as the unread
   * count only updates on a poll and may not know about new notifications
   * yet.
   */
  const listRef = useRef<ListMethods>(null)
  const loadLatest = () => {
    listRef.current?.scrollToOffset({animated: IS_NATIVE, offset: 0})
    onLoadingLatestChange?.(true)
    void refresh(feed, 'kept').finally(() => onLoadingLatestChange?.(false))
  }
  const onSoftReset = useEffectEvent(loadLatest)
  useEffect(() => {
    if (!isScreenFocused || !isActive) return
    return listenSoftReset(() => onSoftReset())
  }, [isScreenFocused, isActive])

  const lastUnreadCheck = useLastUnreadCheck()
  const showRefreshPill = isRefreshPillVisible({
    feed,
    isActive: isScreenFocused && isActive,
    check: lastUnreadCheck,
    top,
    isFetchingTop: isFetching && !isFetchingNextPage,
  })

  let rows: Row[]
  if (!isFetched) {
    rows = [{type: 'loading', key: 'loading'}]
  } else if (notifications.length === 0) {
    rows = isError
      ? [{type: 'error', key: 'error'}]
      : [{type: 'empty', key: 'empty'}]
  } else {
    rows = buildRows(notifications, feed)
    if (isError) {
      rows.push({type: 'loadMoreError', key: 'loadMoreError'})
    }
  }

  const onRefresh = async () => {
    setIsPTRing(true)
    try {
      await refresh(feed, 'server')
    } catch (err) {
      logger.error('Failed to refresh grouped notifications', {
        safeMessage: err,
      })
    }
    setIsPTRing(false)
  }

  const onEndReached = async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more grouped notifications', {
        safeMessage: err,
      })
    }
  }

  return (
    <>
      <MainScrollProvider>
        <List
          ref={listRef}
          testID={`notificationsList-${feed}`}
          style={[a.flex_1]}
          onLayout={event => setListHeight(event.nativeEvent.layout.height)}
          onScrolledDownChange={onScrolledDownChange}
          headerOffset={headerOffset}
          data={rows}
          keyExtractor={(row: Row) => row.key}
          renderItem={({item: row}: {item: Row}) => {
            switch (row.type) {
              case 'section':
                return <SectionHeader section={row.section} />
              case 'notification':
                return <NotificationItem notification={row.notification} />
              case 'followersHeader':
                return <FollowedYouHeader />
              case 'follower':
                return (
                  <FollowerNotification
                    notification={row.notification}
                    profile={row.profile}
                  />
                )
              case 'loading':
                return <NotificationFeedLoadingPlaceholder />
              case 'empty':
                return (
                  // Centred in the space between the header and the bottom bar
                  <View
                    style={[
                      a.justify_center,
                      a.px_lg,
                      {
                        minHeight: Math.max(
                          listHeight - headerOffset - bottomBarOffset,
                          0,
                        ),
                      },
                    ]}>
                    {feed === 'all' ? (
                      <NoNotifications />
                    ) : (
                      <EmptyMessage feed={feed} />
                    )}
                  </View>
                )
              case 'error':
                return (
                  <ErrorMessage
                    message={cleanError(error)}
                    onPressTryAgain={() => void refetch()}
                  />
                )
              case 'loadMoreError':
                return (
                  <LoadMoreRetryBtn
                    label={l`There was an issue fetching notifications. Tap here to try again.`}
                    onPress={() => void fetchNextPage()}
                  />
                )
            }
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={[a.pt_xl]}>
                <ActivityIndicator />
              </View>
            ) : undefined
          }
          refreshing={isPTRing}
          onRefresh={() => void onRefresh()}
          onEndReached={() => void onEndReached()}
          onEndReachedThreshold={2}
          onItemSeen={(row: Row) => {
            if (
              row.type === 'notification' &&
              (row.notification.type === 'reply' ||
                row.notification.type === 'mention' ||
                row.notification.type === 'quote')
            ) {
              trackPostView(row.notification.post)
            }
          }}
          contentContainerStyle={{paddingBottom: 200}}
          initialNumToRender={initialNumToRender}
          windowSize={11}
          sideBorders={false}
          removeClippedSubviews
        />
      </MainScrollProvider>
      <RefreshPill
        visible={showRefreshPill}
        headerHeight={headerOffset}
        titleHeight={titleHeight}
        onPress={loadLatest}
      />
    </>
  )
}

/**
 * Splits notifications into "Today" and "Earlier". When nothing happened
 * today the headers are left out entirely, per the designs. The Followers tab
 * is laid out differently, see `buildFollowerRows`.
 */
function buildRows(
  notifications: NotificationView[],
  feed: GroupedNotificationsFeed,
): Row[] {
  if (feed === 'followers') {
    return buildFollowerRows(notifications)
  }

  const rows: Row[] = []
  const hasToday = isToday(new Date(notifications[0].indexedAt))
  let addedEarlier = false

  if (hasToday) {
    rows.push({type: 'section', key: 'section-today', section: 'today'})
  }
  for (const notification of notifications) {
    if (
      hasToday &&
      !addedEarlier &&
      !isToday(new Date(notification.indexedAt))
    ) {
      rows.push({type: 'section', key: 'section-earlier', section: 'earlier'})
      addedEarlier = true
    }
    rows.push({
      type: 'notification',
      key: notification.id,
      notification,
    })
  }
  return rows
}

/**
 * The Followers tab is a list of people rather than a feed: a single
 * "Followed you" header, then a row per follower. Any other kind keeps its
 * usual notification row.
 *
 * Someone who unfollowed and followed again has several follow
 * notifications, but only gets one row, at their most recent follow.
 */
function buildFollowerRows(notifications: NotificationView[]): Row[] {
  const rows: Row[] = [{type: 'followersHeader', key: 'followersHeader'}]
  const seenDids = new Set<string>()
  for (const notification of notifications) {
    if (isFollowerNotification(notification)) {
      for (const profile of getFollowers(notification)) {
        if (seenDids.has(profile.did)) continue
        seenDids.add(profile.did)
        rows.push({
          type: 'follower',
          key: `${notification.id}-${profile.did}`,
          notification,
          profile,
        })
      }
    } else {
      rows.push({
        type: 'notification',
        key: notification.id,
        notification,
      })
    }
  }
  return rows
}

function SectionHeader({section}: {section: 'today' | 'earlier'}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <View
      style={[
        a.px_lg,
        section === 'today'
          ? a.py_sm
          : [a.border_t, a.pt_md, a.pb_sm, t.atoms.border_contrast_low],
      ]}>
      <Text accessibilityRole="header" style={[a.text_md, a.font_bold]}>
        {section === 'today'
          ? l({message: 'Today', context: 'Notifications section header'})
          : l({message: 'Earlier', context: 'Notifications section header'})}
      </Text>
    </View>
  )
}

/**
 * Shown on the "All" tab when there are no notifications at all, with a way
 * to find people to follow where contact import is available.
 */
function NoNotifications() {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const isFindContactsEnabled =
    useIsFindContactsFeatureEnabledBasedOnGeolocation()
  // Mirrors the gates on the settings entry for the same screen
  const canFindContacts =
    IS_NATIVE &&
    isFindContactsEnabled &&
    !ax.features.enabled(ax.features.ImportContactsSettingsDisable)

  return (
    <View style={[a.align_center, a.gap_md]}>
      <EnvelopeNotificationIcon
        width={80}
        fill={t.atoms.border_contrast_low.borderColor}
      />
      <View style={[a.align_center, a.gap_xs]}>
        <Text
          accessibilityRole="header"
          style={[
            a.text_md,
            a.font_semi_bold,
            a.leading_snug,
            a.text_center,
            t.atoms.text,
          ]}>
          <Trans>No notifications yet</Trans>
        </Text>
        <Text
          style={[
            a.text_sm,
            a.leading_snug,
            a.text_center,
            t.atoms.text_contrast_high,
            // Wraps the copy onto two balanced lines, per the designs
            {maxWidth: 201},
          ]}>
          <Trans>Find some friends to start getting notifications!</Trans>
        </Text>
      </View>
      {canFindContacts && (
        <Link
          to={{screen: 'FindContactsSettings'}}
          label={l`Find friends`}
          size="tiny"
          color="primary_subtle"
          style={[{height: 24, paddingVertical: 0}]}>
          <ButtonText style={[a.font_medium]}>
            <Trans>Find friends</Trans>
          </ButtonText>
        </Link>
      )}
    </View>
  )
}

/**
 * Shown on a tab with nothing in it, e.g. "No replies to show yet".
 */
function EmptyMessage({feed}: {feed: GroupedNotificationsFeed}) {
  const t = useTheme()
  // The macro only compiles `l` from this component's own `useLingui`
  const {t: l} = useLingui()

  let message: string
  switch (feed) {
    case 'all':
      message = l`No notifications yet`
      break
    case 'people-i-follow':
      message = l`No notifications from people you follow yet`
      break
    case 'followers':
      message = l`No followers to show yet`
      break
    case 'conversations':
      message = l`No replies to show yet`
      break
    case 'activity':
      message = l`No activity to show yet`
      break
  }

  return (
    <Text
      style={[
        a.text_md,
        a.leading_snug,
        a.text_center,
        t.atoms.text_contrast_medium,
      ]}>
      {message}
    </Text>
  )
}
