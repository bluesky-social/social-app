import React from 'react'
import {ActivityIndicator, Pressable, StyleSheet, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {useHaptics} from '#/lib/haptics'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {colors, s} from '#/lib/styles'
import {logger} from '#/logger'
import {
  useOverwriteSavedFeedsMutation,
  usePreferencesQuery,
  useUpdateSavedFeedsMutation,
} from '#/state/queries/preferences'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {useSetMinimalShellMode} from '#/state/shell'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import {TextLink} from '#/view/com/util/Link'
import {Text} from '#/view/com/util/text/Text'
import * as Toast from '#/view/com/util/Toast'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {NoFollowingFeed} from '#/screens/Feeds/NoFollowingFeed'
import {NoSavedFeedsOfAnyType} from '#/screens/Feeds/NoSavedFeedsOfAnyType'
import {atoms as a, useTheme} from '#/alf'
import {FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline} from '#/components/icons/FilterTimeline'

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
export function SavedFeeds({}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isMobile, isTabletOrDesktop} = useWebMediaQueries()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {data: preferences} = usePreferencesQuery()
  const {
    mutateAsync: overwriteSavedFeeds,
    variables: optimisticSavedFeedsResponse,
    reset: resetSaveFeedsMutationState,
    error: savedFeedsError,
  } = useOverwriteSavedFeedsMutation()

  /*
   * Use optimistic data if exists and no error, otherwise fallback to remote
   * data
   */
  const currentFeeds =
    optimisticSavedFeedsResponse && !savedFeedsError
      ? optimisticSavedFeedsResponse
      : preferences?.savedFeeds || []
  const pinnedFeeds = currentFeeds.filter(f => f.pinned)
  const unpinnedFeeds = currentFeeds.filter(f => !f.pinned)
  const noSavedFeedsOfAnyType = pinnedFeeds.length + unpinnedFeeds.length === 0
  const noFollowingFeed =
    currentFeeds.every(f => f.type !== 'timeline') && !noSavedFeedsOfAnyType

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <CenteredView
      style={[
        s.hContentRegion,
        pal.border,
        isTabletOrDesktop && styles.desktopContainer,
      ]}>
      <ViewHeader title={_(msg`Edit My Feeds`)} showOnDesktop showBorder />
      <ScrollView style={s.flex1} contentContainerStyle={[styles.noBorder]}>
        {noSavedFeedsOfAnyType && (
          <View
            style={[pal.border, {borderBottomWidth: StyleSheet.hairlineWidth}]}>
            <NoSavedFeedsOfAnyType />
          </View>
        )}

        <View style={[pal.text, pal.border, styles.title]}>
          <Text type="title" style={pal.text}>
            <Trans>Pinned Feeds</Trans>
          </Text>
        </View>

        {preferences ? (
          !pinnedFeeds.length ? (
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
            pinnedFeeds.map(f => (
              <ListItem
                key={f.id}
                feed={f}
                isPinned
                overwriteSavedFeeds={overwriteSavedFeeds}
                resetSaveFeedsMutationState={resetSaveFeedsMutationState}
                currentFeeds={currentFeeds}
                preferences={preferences}
              />
            ))
          )
        ) : (
          <ActivityIndicator style={{marginTop: 20}} />
        )}

        {noFollowingFeed && (
          <View
            style={[pal.border, {borderBottomWidth: StyleSheet.hairlineWidth}]}>
            <NoFollowingFeed />
          </View>
        )}

        <View style={[pal.text, pal.border, styles.title]}>
          <Text type="title" style={pal.text}>
            <Trans>Saved Feeds</Trans>
          </Text>
        </View>
        {preferences ? (
          !unpinnedFeeds.length ? (
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
            unpinnedFeeds.map(f => (
              <ListItem
                key={f.id}
                feed={f}
                isPinned={false}
                overwriteSavedFeeds={overwriteSavedFeeds}
                resetSaveFeedsMutationState={resetSaveFeedsMutationState}
                currentFeeds={currentFeeds}
                preferences={preferences}
              />
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
                text={_(msg`See this guide`)}
              />{' '}
              for more information.
            </Trans>
          </Text>
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </CenteredView>
  )
}

function ListItem({
  feed,
  isPinned,
  currentFeeds,
  overwriteSavedFeeds,
  resetSaveFeedsMutationState,
}: {
  feed: AppBskyActorDefs.SavedFeed
  isPinned: boolean
  currentFeeds: AppBskyActorDefs.SavedFeed[]
  overwriteSavedFeeds: ReturnType<
    typeof useOverwriteSavedFeedsMutation
  >['mutateAsync']
  resetSaveFeedsMutationState: ReturnType<
    typeof useOverwriteSavedFeedsMutation
  >['reset']
  preferences: UsePreferencesQueryResponse
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const playHaptic = useHaptics()
  const {isPending: isUpdatePending, mutateAsync: updateSavedFeeds} =
    useUpdateSavedFeedsMutation()
  const feedUri = feed.value

  const onTogglePinned = React.useCallback(async () => {
    playHaptic()

    try {
      resetSaveFeedsMutationState()

      await updateSavedFeeds([
        {
          ...feed,
          pinned: !feed.pinned,
        },
      ])
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), 'xmark')
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }, [_, playHaptic, feed, updateSavedFeeds, resetSaveFeedsMutationState])

  const onPressUp = React.useCallback(async () => {
    if (!isPinned) return

    const nextFeeds = currentFeeds.slice()
    const ids = currentFeeds.map(f => f.id)
    const index = ids.indexOf(feed.id)
    const nextIndex = index - 1

    if (index === -1 || index === 0) return
    ;[nextFeeds[index], nextFeeds[nextIndex]] = [
      nextFeeds[nextIndex],
      nextFeeds[index],
    ]

    try {
      await overwriteSavedFeeds(nextFeeds)
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), 'xmark')
      logger.error('Failed to set pinned feed order', {message: e})
    }
  }, [feed, isPinned, overwriteSavedFeeds, currentFeeds, _])

  const onPressDown = React.useCallback(async () => {
    if (!isPinned) return

    const nextFeeds = currentFeeds.slice()
    const ids = currentFeeds.map(f => f.id)
    const index = ids.indexOf(feed.id)
    const nextIndex = index + 1

    if (index === -1 || index >= nextFeeds.length - 1) return
    ;[nextFeeds[index], nextFeeds[nextIndex]] = [
      nextFeeds[nextIndex],
      nextFeeds[index],
    ]

    try {
      await overwriteSavedFeeds(nextFeeds)
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), 'xmark')
      logger.error('Failed to set pinned feed order', {message: e})
    }
  }, [feed, isPinned, overwriteSavedFeeds, currentFeeds, _])

  return (
    <View style={[styles.itemContainer, pal.border]}>
      {feed.type === 'timeline' ? (
        <FollowingFeedCard />
      ) : (
        <FeedSourceCard
          key={feedUri}
          feedUri={feedUri}
          style={[isPinned && {paddingRight: 8}]}
          showMinimalPlaceholder
          showSaveBtn={!isPinned}
          hideTopBorder={true}
        />
      )}
      {isPinned ? (
        <>
          <Pressable
            disabled={isUpdatePending}
            accessibilityRole="button"
            onPress={onPressUp}
            hitSlop={HITSLOP_TOP}
            style={state => ({
              backgroundColor: pal.viewLight.backgroundColor,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 4,
              marginRight: 8,
              opacity:
                state.hovered || state.pressed || isUpdatePending ? 0.5 : 1,
            })}>
            <FontAwesomeIcon
              icon="arrow-up"
              size={14}
              style={[pal.textLight]}
            />
          </Pressable>
          <Pressable
            disabled={isUpdatePending}
            accessibilityRole="button"
            onPress={onPressDown}
            hitSlop={HITSLOP_BOTTOM}
            style={state => ({
              backgroundColor: pal.viewLight.backgroundColor,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 4,
              marginRight: 8,
              opacity:
                state.hovered || state.pressed || isUpdatePending ? 0.5 : 1,
            })}>
            <FontAwesomeIcon
              icon="arrow-down"
              size={14}
              style={[pal.textLight]}
            />
          </Pressable>
        </>
      ) : null}
      <View style={{paddingRight: 16}}>
        <Pressable
          disabled={isUpdatePending}
          accessibilityRole="button"
          hitSlop={10}
          onPress={onTogglePinned}
          style={state => ({
            backgroundColor: pal.viewLight.backgroundColor,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 4,
            opacity:
              state.hovered || state.focused || isUpdatePending ? 0.5 : 1,
          })}>
          <FontAwesomeIcon
            icon="thumb-tack"
            size={14}
            color={isPinned ? colors.blue3 : pal.colors.icon}
          />
        </Pressable>
      </View>
    </View>
  )
}

function FollowingFeedCard() {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.flex_1,
        {
          paddingHorizontal: 18,
          paddingVertical: 20,
        },
      ]}>
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_sm,
          {
            width: 36,
            height: 36,
            backgroundColor: t.palette.primary_500,
            marginRight: 10,
          },
        ]}>
        <FilterTimeline
          style={[
            {
              width: 22,
              height: 22,
            },
          ]}
          fill={t.palette.white}
        />
      </View>
      <View
        style={{flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center'}}>
        <Text type="lg-medium" style={[t.atoms.text]} numberOfLines={1}>
          <Trans>Following</Trans>
        </Text>
      </View>
    </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 100,
  },
  noBorder: {
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
})
