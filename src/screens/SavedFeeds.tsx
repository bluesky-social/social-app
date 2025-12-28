import {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {type AppBskyActorDefs} from '@atproto/api'
import {TID} from '@atproto/common-web'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {RECOMMENDED_SAVED_FEEDS, TIMELINE_SAVED_FEED} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {logger} from '#/logger'
import {
  useOverwriteSavedFeedsMutation,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {useSetMinimalShellMode} from '#/state/shell'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import * as Toast from '#/view/com/util/Toast'
import {NoFollowingFeed} from '#/screens/Feeds/NoFollowingFeed'
import {NoSavedFeedsOfAnyType} from '#/screens/Feeds/NoSavedFeedsOfAnyType'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline} from '#/components/icons/FilterTimeline'
import {FloppyDisk_Stroke2_Corner0_Rounded as SaveIcon} from '#/components/icons/FloppyDisk'
import {Menu_Stroke2_Corner0_Rounded as DragHandleIcon} from '#/components/icons/Menu'
import {Pin_Filled_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>
export function SavedFeeds({}: Props) {
  const {data: preferences} = usePreferencesQuery()
  if (!preferences) {
    return <View />
  }
  return <SavedFeedsInner preferences={preferences} />
}

function SavedFeedsInner({
  preferences,
}: {
  preferences: UsePreferencesQueryResponse
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {mutateAsync: overwriteSavedFeeds, isPending: isOverwritePending} =
    useOverwriteSavedFeedsMutation()
  const navigation = useNavigation<NavigationProp>()

  /*
   * Use optimistic data if exists and no error, otherwise fallback to remote
   * data
   */
  const [currentFeeds, setCurrentFeeds] = useState(
    () => preferences.savedFeeds || [],
  )
  const hasUnsavedChanges = currentFeeds !== preferences.savedFeeds
  const pinnedFeeds = currentFeeds.filter(f => f.pinned)
  const unpinnedFeeds = currentFeeds.filter(f => !f.pinned)
  const noSavedFeedsOfAnyType = pinnedFeeds.length + unpinnedFeeds.length === 0
  const noFollowingFeed =
    currentFeeds.every(f => f.type !== 'timeline') && !noSavedFeedsOfAnyType

  const scrollGesture = Gesture.Native()
  const draggedItemId = useSharedValue<string | null>(null)
  const draggedFromIndex = useSharedValue(-1)
  const draggedToIndex = useSharedValue(-1)

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onSaveChanges = async () => {
    try {
      await overwriteSavedFeeds(currentFeeds)
      Toast.show(_(msg({message: 'Feeds updated!', context: 'toast'})))
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.navigate('Feeds')
      }
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), 'xmark')
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Feeds</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Button
          testID="saveChangesBtn"
          size="small"
          color={hasUnsavedChanges ? 'primary' : 'secondary'}
          onPress={onSaveChanges}
          label={_(msg`Save changes`)}
          disabled={isOverwritePending || !hasUnsavedChanges}>
          <ButtonIcon icon={isOverwritePending ? Loader : SaveIcon} />
          <ButtonText>
            {gtMobile ? <Trans>Save changes</Trans> : <Trans>Save</Trans>}
          </ButtonText>
        </Button>
      </Layout.Header.Outer>

      <Layout.Content simultaneousHandlers={scrollGesture}>
        {noSavedFeedsOfAnyType && (
          <View style={[t.atoms.border_contrast_low, a.border_b]}>
            <NoSavedFeedsOfAnyType
              onAddRecommendedFeeds={() =>
                setCurrentFeeds(
                  RECOMMENDED_SAVED_FEEDS.map(f => ({
                    ...f,
                    id: TID.nextStr(),
                  })),
                )
              }
            />
          </View>
        )}

        <SectionHeaderText>
          <Trans>Pinned Feeds</Trans>
        </SectionHeaderText>

        {preferences ? (
          !pinnedFeeds.length ? (
            <View style={[a.flex_1, a.p_lg]}>
              <Admonition type="info">
                <Trans>You don't have any pinned feeds.</Trans>
              </Admonition>
            </View>
          ) : (
            pinnedFeeds.map(f => (
              <ListItem
                key={f.id}
                feed={f}
                isPinned
                currentFeeds={currentFeeds}
                setCurrentFeeds={setCurrentFeeds}
                scrollGesture={scrollGesture}
                draggedItemId={draggedItemId}
                draggedFromIndex={draggedFromIndex}
                draggedToIndex={draggedToIndex}
              />
            ))
          )
        ) : (
          <View style={[a.w_full, a.py_2xl, a.align_center]}>
            <Loader size="xl" />
          </View>
        )}

        {noFollowingFeed && (
          <View style={[t.atoms.border_contrast_low, a.border_b]}>
            <NoFollowingFeed
              onAddFeed={() =>
                setCurrentFeeds(feeds => [
                  ...feeds,
                  {...TIMELINE_SAVED_FEED, id: TID.next().toString()},
                ])
              }
            />
          </View>
        )}

        <SectionHeaderText>
          <Trans>Saved Feeds</Trans>
        </SectionHeaderText>

        {preferences ? (
          !unpinnedFeeds.length ? (
            <View style={[a.flex_1, a.p_lg]}>
              <Admonition type="info">
                <Trans>You don't have any saved feeds.</Trans>
              </Admonition>
            </View>
          ) : (
            unpinnedFeeds.map(f => (
              <ListItem
                key={f.id}
                feed={f}
                isPinned={false}
                currentFeeds={currentFeeds}
                setCurrentFeeds={setCurrentFeeds}
                scrollGesture={scrollGesture}
                draggedItemId={draggedItemId}
                draggedFromIndex={draggedFromIndex}
                draggedToIndex={draggedToIndex}
              />
            ))
          )
        ) : (
          <View style={[a.w_full, a.py_2xl, a.align_center]}>
            <Loader size="xl" />
          </View>
        )}

        <View style={[a.px_lg, a.py_xl]}>
          <Text
            style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}>
            <Trans>
              Feeds are custom algorithms that users build with a little coding
              expertise.{' '}
              <InlineLinkText
                to="https://github.com/bluesky-social/feed-generator"
                label={_(msg`See this guide`)}
                disableMismatchWarning
                style={[a.leading_snug]}>
                See this guide
              </InlineLinkText>{' '}
              for more information.
            </Trans>
          </Text>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

function ListItem({
  feed,
  isPinned,
  currentFeeds,
  setCurrentFeeds,
  scrollGesture,
  draggedItemId,
  draggedFromIndex,
  draggedToIndex,
}: {
  feed: AppBskyActorDefs.SavedFeed
  isPinned: boolean
  currentFeeds: AppBskyActorDefs.SavedFeed[]
  setCurrentFeeds: React.Dispatch<AppBskyActorDefs.SavedFeed[]>
  scrollGesture?: any
  draggedItemId?: any
  draggedFromIndex?: any
  draggedToIndex?: any
}) {
  const {_} = useLingui()
  const t = useTheme()
  const playHaptic = useHaptics()
  const feedUri = feed.value

  const [itemHeight, setItemHeight] = useState(0)
  const translateY = useSharedValue(0)
  const isDragging = useSharedValue(false)
  const lastTentativeIndex = useSharedValue(-1)

  const reorderFeeds = useCallback(
    (fromIndex: number, toIndex: number) => {
      const nextFeeds = currentFeeds.slice()
      const [movedItem] = nextFeeds.splice(fromIndex, 1)
      nextFeeds.splice(toIndex, 0, movedItem)
      setCurrentFeeds(nextFeeds)
    },
    [currentFeeds, setCurrentFeeds],
  )

  const panGesture = useMemo(() => {
    if (!isPinned || !scrollGesture || !draggedItemId) return Gesture.Native()

    return Gesture.Pan()
      .blocksExternalGesture(scrollGesture)
      .activeOffsetY([-5, 5])
      .failOffsetX([-20, 20])
      .onStart(() => {
        'worklet'
        isDragging.set(true)
        const pinnedFeeds = currentFeeds.filter(f => f.pinned)
        const currentIndex = pinnedFeeds.findIndex(f => f.id === feed.id)
        draggedItemId.set(feed.id)
        draggedFromIndex.set(currentIndex)
        draggedToIndex.set(currentIndex)
        runOnJS(playHaptic)()
      })
      .onUpdate(evt => {
        'worklet'
        if (itemHeight === 0) return

        const newTranslateY = evt.translationY
        const positionOffset = Math.round(newTranslateY / itemHeight)
        const currentIndex = currentFeeds
          .filter(f => f.pinned)
          .findIndex(f => f.id === feed.id)
        const pinnedCount = currentFeeds.filter(f => f.pinned).length
        const tentativeIndex = Math.max(
          0,
          Math.min(currentIndex + positionOffset, pinnedCount - 1),
        )

        if (tentativeIndex !== lastTentativeIndex.get()) {
          runOnJS(playHaptic)()
          lastTentativeIndex.set(tentativeIndex)
          draggedToIndex.set(tentativeIndex)
        }

        translateY.set(newTranslateY)
      })
      .onEnd(evt => {
        'worklet'
        if (itemHeight === 0) {
          translateY.set(withSpring(0))
          isDragging.set(false)
          draggedItemId.set(null)
          draggedFromIndex.set(-1)
          draggedToIndex.set(-1)
          return
        }

        const positionOffset = Math.round(evt.translationY / itemHeight)
        const pinnedFeeds = currentFeeds.filter(f => f.pinned)
        const currentIndex = pinnedFeeds.findIndex(f => f.id === feed.id)
        const newIndex = Math.max(
          0,
          Math.min(currentIndex + positionOffset, pinnedFeeds.length - 1),
        )

        translateY.set(
          withSpring(0, {
            mass: 1.25,
            damping: 300,
            stiffness: 800,
          }),
        )
        isDragging.set(false)
        lastTentativeIndex.set(-1)
        draggedItemId.set(null)
        draggedFromIndex.set(-1)
        draggedToIndex.set(-1)

        if (newIndex !== currentIndex && currentIndex !== -1) {
          runOnJS(reorderFeeds)(currentIndex, newIndex)
        }
      })
  }, [
    isPinned,
    scrollGesture,
    draggedItemId,
    draggedFromIndex,
    draggedToIndex,
    itemHeight,
    currentFeeds,
    feed.id,
    playHaptic,
    reorderFeeds,
    isDragging,
    lastTentativeIndex,
    translateY,
  ])

  const animatedStyle = useAnimatedStyle(() => {
    if (!draggedItemId || !isPinned) {
      return {
        transform: [{translateY: 0}],
        opacity: 1,
        zIndex: 0,
      }
    }

    const isBeingDragged = draggedItemId.get() === feed.id

    if (isBeingDragged) {
      // This is the item being dragged
      return {
        transform: [
          {translateY: translateY.get()},
          {scale: isDragging.get() ? 1.02 : 1},
        ],
        opacity: isDragging.get() ? 0.8 : 1,
        zIndex: isDragging.get() ? 10 : 0,
      }
    }

    // This is a non-dragged item - calculate if it should shift
    const pinnedFeeds = currentFeeds.filter(f => f.pinned)
    const myIndex = pinnedFeeds.findIndex(f => f.id === feed.id)
    const fromIndex = draggedFromIndex.get()
    const toIndex = draggedToIndex.get()

    if (myIndex === -1 || fromIndex === -1 || toIndex === -1) {
      return {
        transform: [{translateY: 0}],
        opacity: 1,
        zIndex: 0,
      }
    }

    let offset = 0

    if (fromIndex < toIndex) {
      // Dragging downward
      if (myIndex > fromIndex && myIndex <= toIndex) {
        offset = -itemHeight // Shift up
      }
    } else if (fromIndex > toIndex) {
      // Dragging upward
      if (myIndex < fromIndex && myIndex >= toIndex) {
        offset = itemHeight // Shift down
      }
    }

    return {
      transform: [
        {
          translateY: withSpring(offset, {
            mass: 1.25,
            damping: 300,
            stiffness: 800,
          }),
        },
      ],
      opacity: 1,
      zIndex: 0,
    }
  }, [draggedItemId, isPinned, feed.id, currentFeeds, itemHeight])

  const onTogglePinned = async () => {
    playHaptic()
    setCurrentFeeds(
      currentFeeds.map(f =>
        f.id === feed.id ? {...feed, pinned: !feed.pinned} : f,
      ),
    )
  }

  const onPressRemove = async () => {
    playHaptic()
    setCurrentFeeds(currentFeeds.filter(f => f.id !== feed.id))
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[a.flex_row, animatedStyle]}
        onLayout={e => {
          if (itemHeight === 0) {
            setItemHeight(e.nativeEvent.layout.height)
          }
        }}>
        {/* Drag Handle - only for pinned feeds */}
        {isPinned && (
          <View style={[a.justify_center, a.pl_md]}>
            <View style={[a.p_xs]}>
              <DragHandleIcon size="md" style={t.atoms.text_contrast_medium} />
            </View>
          </View>
        )}

        {/* Feed Card */}
        {feed.type === 'timeline' ? (
          <FollowingFeedCard />
        ) : (
          <FeedSourceCard
            key={feedUri}
            feedUri={feedUri}
            style={[isPinned && a.pr_sm]}
            showMinimalPlaceholder
            hideTopBorder={true}
          />
        )}

        {/* Action Buttons */}
        <View style={[a.pr_lg, a.flex_row, a.align_center, a.gap_sm]}>
          {!isPinned && (
            <Button
              testID={`feed-${feedUri}-toggleSave`}
              label={_(msg`Remove from my feeds`)}
              onPress={onPressRemove}
              size="small"
              color="secondary"
              variant="ghost"
              shape="square">
              <ButtonIcon icon={TrashIcon} />
            </Button>
          )}
          <Button
            testID={`feed-${feed.type}-togglePin`}
            label={isPinned ? _(msg`Unpin feed`) : _(msg`Pin feed`)}
            onPress={onTogglePinned}
            size="small"
            color={isPinned ? 'primary_subtle' : 'secondary'}
            shape="square">
            <ButtonIcon icon={PinIcon} />
          </Button>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

function SectionHeaderText({children}: {children: React.ReactNode}) {
  // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    <View style={[a.flex_row, a.flex_1, a.px_lg, a.pt_2xl, a.pb_xs]}>
      <Text style={[a.text_xl, a.font_bold, a.leading_snug]}>{children}</Text>
    </View>
  )
}

function FollowingFeedCard() {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.flex_1, a.p_md]}>
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_sm,
          a.mr_md,
          {
            width: 36,
            height: 36,
            backgroundColor: t.palette.primary_500,
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
      <View style={[a.flex_1, a.flex_row, a.gap_sm, a.align_center]}>
        <Text style={[a.text_sm, a.font_semi_bold, a.leading_snug]}>
          <Trans context="feed-name">Following</Trans>
        </Text>
      </View>
    </View>
  )
}
