import React from 'react'
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQueryClient} from '@tanstack/react-query'
import {track} from '#/lib/analytics/analytics'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {CommonNavigatorParams} from 'lib/routes/types'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {ScrollView, CenteredView} from 'view/com/util/Views'
import {Text} from 'view/com/util/text/Text'
import {s, colors} from 'lib/styles'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import * as Toast from 'view/com/util/Toast'
import {Haptics} from 'lib/haptics'
import {TextLink} from 'view/com/util/Link'
import {logger} from '#/logger'
import {useSetMinimalShellMode} from '#/state/shell'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  usePreferencesQuery,
  usePinFeedMutation,
  useUnpinFeedMutation,
  useSetSaveFeedsMutation,
  preferencesQueryKey,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences'

const HITSLOP_TOP = {
  top: 20,
  left: 20,
  bottom: 5,
  right: 20,
}
const HITSLOP_BOTTOM = {
  top: 5,
  left: 20,
  bottom: 20,
  right: 20,
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>
export const SavedFeeds = withAuthRequired(function SavedFeedsImpl({}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isMobile, isTabletOrDesktop} = useWebMediaQueries()
  const {screen} = useAnalytics()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {data: preferences} = usePreferencesQuery()

  useFocusEffect(
    React.useCallback(() => {
      screen('SavedFeeds')
      setMinimalShellMode(false)
    }, [screen, setMinimalShellMode]),
  )

  return (
    <CenteredView
      style={[
        s.hContentRegion,
        pal.border,
        isTabletOrDesktop && styles.desktopContainer,
      ]}>
      <ViewHeader title={_(msg`Edit My Feeds`)} showOnDesktop showBorder />
      <ScrollView style={s.flex1}>
        <View style={[pal.text, pal.border, styles.title]}>
          <Text type="title" style={pal.text}>
            <Trans>Pinned Feeds</Trans>
          </Text>
        </View>
        {preferences?.feeds ? (
          !preferences.feeds.pinned.length ? (
            <View
              style={[
                pal.border,
                isMobile && s.flex1,
                pal.viewLight,
                styles.empty,
              ]}>
              <Text type="lg" style={[pal.text]}>
                <Trans>You don't have any pinned feeds.</Trans>
              </Text>
            </View>
          ) : (
            preferences?.feeds?.pinned?.map(uri => (
              <ListItem key={uri} feedUri={uri} isPinned />
            ))
          )
        ) : (
          <ActivityIndicator style={{marginTop: 20}} />
        )}
        <View style={[pal.text, pal.border, styles.title]}>
          <Text type="title" style={pal.text}>
            <Trans>Saved Feeds</Trans>
          </Text>
        </View>
        {preferences?.feeds ? (
          !preferences.feeds.unpinned.length ? (
            <View
              style={[
                pal.border,
                isMobile && s.flex1,
                pal.viewLight,
                styles.empty,
              ]}>
              <Text type="lg" style={[pal.text]}>
                <Trans>You don't have any saved feeds.</Trans>
              </Text>
            </View>
          ) : (
            preferences.feeds.unpinned.map(uri => (
              <ListItem key={uri} feedUri={uri} isPinned={false} />
            ))
          )
        ) : (
          <ActivityIndicator style={{marginTop: 20}} />
        )}

        <View style={styles.footerText}>
          <Text type="sm" style={pal.textLight}>
            <Trans>
              Feeds are custom algorithms that users build with a little coding
              expertise.{' '}
              <TextLink
                type="sm"
                style={pal.link}
                href="https://github.com/bluesky-social/feed-generator"
                text="See this guide"
              />{' '}
              for more information.
            </Trans>
          </Text>
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </CenteredView>
  )
})

function ListItem({
  feedUri,
  isPinned,
}: {
  feedUri: string // uri
  isPinned: boolean
}) {
  const pal = usePalette('default')
  const queryClient = useQueryClient()
  const {isPending: isPinPending, mutateAsync: pinFeed} = usePinFeedMutation()
  const {isPending: isUnpinPending, mutateAsync: unpinFeed} =
    useUnpinFeedMutation()
  const {isPending: isMovePending, mutateAsync: setSavedFeeds} =
    useSetSaveFeedsMutation()

  const onTogglePinned = React.useCallback(async () => {
    Haptics.default()

    try {
      if (isPinned) {
        await unpinFeed({uri: feedUri})
      } else {
        await pinFeed({uri: feedUri})
      }
    } catch (e) {
      Toast.show('There was an issue contacting the server')
      logger.error('Failed to toggle pinned feed', {error: e})
    }
  }, [feedUri, isPinned, pinFeed, unpinFeed])

  const onPressUp = React.useCallback(async () => {
    if (!isPinned) return

    const feeds =
      queryClient.getQueryData<UsePreferencesQueryResponse>(
        preferencesQueryKey,
      )?.feeds
    const pinned = feeds?.pinned ?? []
    const index = pinned.indexOf(feedUri)

    if (index === -1 || index === 0) return
    ;[pinned[index], pinned[index - 1]] = [pinned[index - 1], pinned[index]]

    try {
      await setSavedFeeds({saved: feeds?.saved ?? [], pinned})
      track('CustomFeed:Reorder', {
        uri: feedUri,
        index: pinned.indexOf(feedUri),
      })
    } catch (e) {
      Toast.show('There was an issue contacting the server')
      logger.error('Failed to set pinned feed order', {error: e})
    }
  }, [feedUri, isPinned, queryClient, setSavedFeeds])

  const onPressDown = React.useCallback(async () => {
    if (!isPinned) return

    const feeds =
      queryClient.getQueryData<UsePreferencesQueryResponse>(
        preferencesQueryKey,
      )?.feeds
    const pinned = feeds?.pinned ?? []
    const index = pinned.indexOf(feedUri)

    if (index === -1 || index >= pinned.length - 1) return
    ;[pinned[index], pinned[index + 1]] = [pinned[index + 1], pinned[index]]

    try {
      await setSavedFeeds({saved: feeds?.saved ?? [], pinned})
      track('CustomFeed:Reorder', {
        uri: feedUri,
        index: pinned.indexOf(feedUri),
      })
    } catch (e) {
      Toast.show('There was an issue contacting the server')
      logger.error('Failed to set pinned feed order', {error: e})
    }
  }, [feedUri, isPinned, queryClient, setSavedFeeds])

  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.itemContainer, pal.border]}>
      {isPinned ? (
        <View style={styles.webArrowButtonsContainer}>
          <TouchableOpacity
            disabled={isMovePending}
            accessibilityRole="button"
            onPress={onPressUp}
            hitSlop={HITSLOP_TOP}>
            <FontAwesomeIcon
              icon="arrow-up"
              size={12}
              style={[pal.text, styles.webArrowUpButton]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isMovePending}
            accessibilityRole="button"
            onPress={onPressDown}
            hitSlop={HITSLOP_BOTTOM}>
            <FontAwesomeIcon icon="arrow-down" size={12} style={[pal.text]} />
          </TouchableOpacity>
        </View>
      ) : null}
      <FeedSourceCard
        key={feedUri}
        feedUri={feedUri}
        style={styles.noBorder}
        showSaveBtn
      />
      <TouchableOpacity
        disabled={isPinPending || isUnpinPending}
        accessibilityRole="button"
        hitSlop={10}
        onPress={onTogglePinned}>
        <FontAwesomeIcon
          icon="thumb-tack"
          size={20}
          color={isPinned ? colors.blue3 : pal.colors.icon}
        />
      </TouchableOpacity>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  desktopContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    // @ts-ignore only rendered on web
    minHeight: '100vh',
  },
  empty: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
  },
  title: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingRight: 16,
  },
  webArrowButtonsContainer: {
    paddingLeft: 16,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  webArrowUpButton: {
    marginBottom: 10,
  },
  noBorder: {
    borderTopWidth: 0,
  },
  footerText: {
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 100,
  },
})
