import React, {useCallback, useMemo, useState} from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import debounce from 'lodash.debounce'

import {useHaptics} from '#/lib/haptics'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {ComposeIcon2} from '#/lib/icons'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {s} from '#/lib/styles'
import {isNative, isWeb} from '#/platform/detection'
import {
  type SavedFeedItem,
  useGetPopularFeedsQuery,
  useSavedFeeds,
  useSearchPopularFeedsMutation,
} from '#/state/queries/feed'
import {useUpdateSavedFeedsMutation} from '#/state/queries/preferences'
import {useAgent, useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useSetSelectedFeed} from '#/state/shell/selected-feed'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {FAB} from '#/view/com/util/fab/FAB'
import {List, type ListMethods} from '#/view/com/util/List'
import {FeedFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {Text} from '#/view/com/util/text/Text'
import {NoFollowingFeed} from '#/screens/Feeds/NoFollowingFeed'
import {NoSavedFeedsOfAnyType} from '#/screens/Feeds/NoSavedFeedsOfAnyType'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as FeedCard from '#/components/FeedCard'
import {SearchInput} from '#/components/forms/SearchInput'
import {FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline} from '#/components/icons/FilterTimeline'
import {Menu_Stroke2_Corner0_Rounded as DragHandleIcon} from '#/components/icons/Menu'
import {Pin_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as Layout from '#/components/Layout'
import * as ListCard from '#/components/ListCard'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Feeds'>

type FlatlistSlice =
  | {
      type: 'error'
      key: string
      error: string
    }
  | {
      type: 'savedFeedsHeader'
      key: string
    }
  | {
      type: 'savedFeedPlaceholder'
      key: string
    }
  | {
      type: 'savedFeedNoResults'
      key: string
    }
  | {
      type: 'pinnedFeedsSection'
      key: string
    }
  | {
      type: 'discoverFeedsSection'
      key: string
    }
  | {
      type: 'noFollowingFeed'
      key: string
    }
  | {
      type: 'noPinnedFeeds'
      key: string
    }

export function FeedsScreen(_props: Props) {
  const {
    data: savedFeeds,
    isPlaceholderData: isSavedFeedsPlaceholder,
    error: savedFeedsError,
    refetch: refetchSavedFeeds,
  } = useSavedFeeds()

  // Calculate stable metadata - only primitives
  const pinnedFeeds = savedFeeds?.feeds?.filter(s => s.config.pinned) ?? []
  const savedFeedsCount = savedFeeds?.count ?? 0
  const savedFeedsLength = savedFeeds?.feeds?.length ?? 0
  const pinnedCount = pinnedFeeds.length
  const hasFollowingFeed = pinnedFeeds.some(f => f.type === 'timeline')

  return (
    <FeedsScreenInner
      savedFeedsCount={savedFeedsCount}
      savedFeedsLength={savedFeedsLength}
      pinnedCount={pinnedCount}
      hasFollowingFeed={hasFollowingFeed}
      isSavedFeedsPlaceholder={isSavedFeedsPlaceholder}
      savedFeedsError={savedFeedsError}
      refetchSavedFeeds={refetchSavedFeeds}
    />
  )
}

type FeedsScreenInnerProps = {
  savedFeedsCount: number
  savedFeedsLength: number
  pinnedCount: number
  hasFollowingFeed: boolean
  isSavedFeedsPlaceholder: boolean
  savedFeedsError: Error | null
  refetchSavedFeeds: () => Promise<unknown>
}

const FeedsScreenInner = React.memo(
  function FeedsScreenInner({
    savedFeedsCount,
    savedFeedsLength,
    pinnedCount,
    hasFollowingFeed,
    isSavedFeedsPlaceholder,
    savedFeedsError,
    refetchSavedFeeds,
  }: FeedsScreenInnerProps) {
    const pal = usePalette('default')
    const {openComposer} = useOpenComposer()
    const [isPTR, setIsPTR] = React.useState(false)

    // Overlay state - use shared value for visibility to avoid re-renders on drop
    // The state is only updated on drag START (to show correct content), not on drop
    const [overlayFeed, setOverlayFeed] = useState<SavedFeedItem | null>(null)
    const overlayY = useSharedValue(0)
    const overlayVisible = useSharedValue(0) // 0 = hidden, 1 = visible

    const {_} = useLingui()
    const setMinimalShellMode = useSetMinimalShellMode()
    const {hasSession} = useSession()
    const listRef = React.useRef<ListMethods>(null)

    // Refs for DiscoverFeedsSection to call for pull-to-refresh and pagination
    const discoverRefetchRef = React.useRef<(() => Promise<void>) | null>(null)
    const discoverFetchMoreRef = React.useRef<(() => void) | null>(null)

    const onPressCompose = React.useCallback(() => {
      openComposer({})
    }, [openComposer])

    const onPullToRefresh = React.useCallback(async () => {
      setIsPTR(true)
      await Promise.all([
        refetchSavedFeeds().catch(_e => undefined),
        discoverRefetchRef.current?.().catch(_e => undefined),
      ])
      setIsPTR(false)
    }, [setIsPTR, refetchSavedFeeds])

    const onEndReached = React.useCallback(() => {
      discoverFetchMoreRef.current?.()
    }, [])

    useFocusEffect(
      React.useCallback(() => {
        setMinimalShellMode(false)
      }, [setMinimalShellMode]),
    )

    const items = React.useMemo(() => {
      let slices: FlatlistSlice[] = []
      const hasActualSavedCount =
        !isSavedFeedsPlaceholder ||
        (isSavedFeedsPlaceholder && savedFeedsCount > 0)
      const canShowDiscoverSection =
        !hasSession || (hasSession && hasActualSavedCount)

      if (hasSession) {
        slices.push({
          key: 'savedFeedsHeader',
          type: 'savedFeedsHeader',
        })

        if (savedFeedsError) {
          slices.push({
            key: 'savedFeedsError',
            type: 'error',
            error: cleanError(savedFeedsError.toString()),
          })
        } else {
          if (isSavedFeedsPlaceholder && !savedFeedsLength) {
            const min = 8
            const count = savedFeedsCount === 0 ? min : savedFeedsCount
            Array(count)
              .fill(0)
              .forEach((_, i) => {
                slices.push({
                  key: 'savedFeedPlaceholder' + i,
                  type: 'savedFeedPlaceholder',
                })
              })
          } else {
            if (savedFeedsLength > 0) {
              // Render all pinned feeds as a single section
              if (pinnedCount > 0) {
                slices.push({
                  key: 'pinnedFeedsSection',
                  type: 'pinnedFeedsSection',
                })

                if (!hasFollowingFeed) {
                  slices.push({
                    key: 'noFollowingFeed',
                    type: 'noFollowingFeed',
                  })
                }
              } else {
                slices.push({
                  key: 'noPinnedFeeds',
                  type: 'noPinnedFeeds',
                })
              }
            } else {
              slices.push({
                key: 'savedFeedNoResults',
                type: 'savedFeedNoResults',
              })
            }
          }
        }
      }

      if (!hasSession || (hasSession && canShowDiscoverSection)) {
        slices.push({
          key: 'discoverFeedsSection',
          type: 'discoverFeedsSection',
        })
      }

      return slices
    }, [
      hasSession,
      savedFeedsCount,
      savedFeedsLength,
      pinnedCount,
      hasFollowingFeed,
      isSavedFeedsPlaceholder,
      savedFeedsError,
    ])

    const renderItem = React.useCallback(
      ({item}: {item: FlatlistSlice}) => {
        if (item.type === 'error') {
          return <ErrorMessage message={item.error} />
        } else if (item.type === 'savedFeedsHeader') {
          return <FeedsSavedHeader />
        } else if (item.type === 'savedFeedNoResults') {
          return (
            <View
              style={[
                pal.border,
                {
                  borderBottomWidth: 1,
                },
              ]}>
              <NoSavedFeedsOfAnyType />
            </View>
          )
        } else if (item.type === 'savedFeedPlaceholder') {
          return <SavedFeedPlaceholder />
        } else if (item.type === 'pinnedFeedsSection') {
          // Render the entire pinned feeds section as one component
          // This component manages its own data subscription, preventing re-renders of FeedsScreen
          return (
            <PinnedFeedsSection
              overlayY={overlayY}
              overlayVisible={overlayVisible}
              onOverlayFeedChange={setOverlayFeed}
            />
          )
        } else if (item.type === 'discoverFeedsSection') {
          return (
            <DiscoverFeedsSection
              refetchRef={discoverRefetchRef}
              fetchMoreRef={discoverFetchMoreRef}
              listRef={listRef}
            />
          )
        } else if (item.type === 'noFollowingFeed') {
          return (
            <View
              style={[
                pal.border,
                {
                  borderBottomWidth: 1,
                },
              ]}>
              <NoFollowingFeed />
            </View>
          )
        } else if (item.type === 'noPinnedFeeds') {
          return (
            <View
              style={[
                pal.border,
                a.flex_row,
                a.align_center,
                a.gap_sm,
                {
                  borderBottomWidth: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                },
              ]}>
              <PinIcon size="sm" fill={pal.colors.textLight} />
              <Text type="md" style={pal.textLight}>
                <Trans>You don't have any pinned feeds.</Trans>
              </Text>
            </View>
          )
        }
        return null
      },
      [
        pal.border,
        pal.textLight,
        pal.colors,
        overlayY,
        overlayVisible,
        setOverlayFeed,
        discoverRefetchRef,
        listRef,
      ],
    )

    return (
      <View style={{flex: 1}}>
        <Layout.Screen testID="FeedsScreen">
          <Layout.Center>
            <Layout.Header.Outer>
              <Layout.Header.BackButton />
              <Layout.Header.Content>
                <Layout.Header.TitleText>
                  <Trans>Feeds</Trans>
                </Layout.Header.TitleText>
              </Layout.Header.Content>
              <Layout.Header.Slot />
            </Layout.Header.Outer>

            <List
              ref={listRef}
              data={items}
              keyExtractor={item => item.key}
              contentContainerStyle={styles.contentContainer}
              renderItem={renderItem}
              refreshing={isPTR}
              onRefresh={onPullToRefresh}
              onEndReached={onEndReached}
              onEndReachedThreshold={2}
              initialNumToRender={10}
              desktopFixedHeight
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              sideBorders={false}
            />
          </Layout.Center>

          {hasSession && (
            <FAB
              testID="composeFAB"
              onPress={onPressCompose}
              icon={
                <ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />
              }
              accessibilityRole="button"
              accessibilityLabel={_(msg`New post`)}
              accessibilityHint=""
            />
          )}
        </Layout.Screen>

        {/* Drag overlay - rendered outside Layout.Screen for correct absolute positioning */}
        {overlayFeed && (
          <DragOverlay
            savedFeed={overlayFeed}
            currentY={overlayY}
            visible={overlayVisible}
          />
        )}
      </View>
    )
  },
  (prev, next) => {
    // Only re-render if structural values change
    const isEqual =
      prev.savedFeedsCount === next.savedFeedsCount &&
      prev.savedFeedsLength === next.savedFeedsLength &&
      prev.pinnedCount === next.pinnedCount &&
      prev.hasFollowingFeed === next.hasFollowingFeed &&
      prev.isSavedFeedsPlaceholder === next.isSavedFeedsPlaceholder &&
      // Compare error by message, not reference
      (prev.savedFeedsError?.message ?? null) ===
        (next.savedFeedsError?.message ?? null)
    return isEqual
  },
)

// Separate component for pinned feeds - manages its own drag state AND data subscription
// This prevents drag operations and query updates from re-rendering FeedsScreen
const PinnedFeedsSection = React.memo(function PinnedFeedsSection({
  overlayY,
  overlayVisible,
  onOverlayFeedChange,
}: {
  overlayY: Animated.SharedValue<number>
  overlayVisible: Animated.SharedValue<number>
  onOverlayFeedChange: (feed: SavedFeedItem | null) => void
}) {
  const {mutateAsync: updateSavedFeeds} = useUpdateSavedFeedsMutation()
  const agent = useAgent()

  // Subscribe to saved feeds directly
  const {data: savedFeeds} = useSavedFeeds()
  const serverFeeds = React.useMemo(
    () => savedFeeds?.feeds?.filter(f => f.config.pinned) ?? [],
    [savedFeeds?.feeds],
  )

  // Use a ref for feed order to avoid re-render issues during drag
  // The ref holds the current order, state is just used to trigger re-renders
  const feedsRef = React.useRef<SavedFeedItem[]>(serverFeeds)
  const [, forceRender] = useState(0)

  // Track if we're actively dragging (not just "edited recently")
  const isDraggingRef = React.useRef(false)

  // Keep ref in sync with server feeds
  // Merge changes: keep local order for existing feeds, add new ones, remove deleted ones
  React.useEffect(() => {
    if (!isDraggingRef.current) {
      const currentIds = new Set(feedsRef.current.map(f => f.config.id))
      const serverIds = new Set(serverFeeds.map(f => f.config.id))

      // Find new feeds (in server but not local) and removed feeds (in local but not server)
      const newFeeds = serverFeeds.filter(f => !currentIds.has(f.config.id))
      const removedIds = new Set(
        [...currentIds].filter(id => !serverIds.has(id)),
      )

      if (newFeeds.length > 0 || removedIds.size > 0) {
        // Keep existing feeds in their current order, remove deleted, add new at end
        const updatedFeeds = feedsRef.current
          .filter(f => !removedIds.has(f.config.id))
          .concat(newFeeds)
        feedsRef.current = updatedFeeds
        forceRender(n => n + 1)
      }
    }
  }, [serverFeeds])

  // Always read from ref
  const feeds = feedsRef.current

  // Debounced save to server - completely silent, no React Query involvement
  const savedFeedsRef = React.useRef(savedFeeds)
  savedFeedsRef.current = savedFeeds
  const debouncedSave = React.useMemo(
    () =>
      debounce((newLocalFeeds: SavedFeedItem[]) => {
        const allFeeds = savedFeedsRef.current?.feeds
        if (!allFeeds) return

        const unpinnedFeeds = allFeeds.filter(f => !f.config.pinned)
        const newOrder = [...newLocalFeeds, ...unpinnedFeeds].map(f => f.config)

        agent.overwriteSavedFeeds(newOrder).catch(() => {
          // Silently ignore errors for now
        })
      }, 500),
    [agent],
  )

  // Drag state
  const scrollGesture = useMemo(() => Gesture.Native(), [])
  const itemHeightRef = React.useRef(0)
  const itemHeightShared = useSharedValue(0)
  const [draggedItem, setDraggedItem] = useState<{
    feed: SavedFeedItem
    fromIndex: number
    startY: number
  } | null>(null)
  // Separate hidden state that persists through reorder to prevent flash
  const [hiddenFeedId, setHiddenFeedId] = useState<string | null>(null)
  const dragTargetIndexRef = React.useRef(-1)
  const [, forceUpdateForShift] = useState(0)

  const onReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      // Update the ref directly - no state update, no re-render yet
      const newFeeds = [...feedsRef.current]
      const [moved] = newFeeds.splice(fromIndex, 1)
      newFeeds.splice(toIndex, 0, moved)
      feedsRef.current = newFeeds

      // Save to server in background (debounced, fire-and-forget)
      debouncedSave(newFeeds)

      // Clear ALL visual state together and trigger ONE re-render
      setTimeout(() => {
        isDraggingRef.current = false
        dragTargetIndexRef.current = -1
        setDraggedItem(null)
        setHiddenFeedId(null)
        overlayVisible.set(0)
        forceRender(n => n + 1)
      }, 0)
    },
    [overlayVisible, debouncedSave],
  )

  return (
    <View>
      {feeds.map((feed, index) => {
        const dragFromIndex = draggedItem?.fromIndex ?? -1
        const dragTargetIndex = dragTargetIndexRef.current
        const height = itemHeightRef.current || 60
        let shiftOffset = 0

        if (
          dragFromIndex !== -1 &&
          dragTargetIndex !== -1 &&
          dragFromIndex !== index
        ) {
          if (dragFromIndex < dragTargetIndex) {
            if (index > dragFromIndex && index <= dragTargetIndex) {
              shiftOffset = -height
            }
          } else if (dragFromIndex > dragTargetIndex) {
            if (index < dragFromIndex && index >= dragTargetIndex) {
              shiftOffset = height
            }
          }
        }

        return (
          <EditableFeedItem
            key={feed.config.id}
            savedFeed={feed}
            isPinned={true}
            pinnedIndex={index}
            pinnedCount={feeds.length}
            isBeingDragged={hiddenFeedId === feed.config.id}
            shiftOffset={shiftOffset}
            scrollGesture={scrollGesture}
            itemHeightRef={itemHeightRef}
            itemHeightShared={itemHeightShared}
            draggedCurrentY={overlayY}
            onDragStart={(startY: number) => {
              isDraggingRef.current = true
              dragTargetIndexRef.current = index
              setDraggedItem({
                feed,
                fromIndex: index,
                startY,
              })
              setHiddenFeedId(feed.config.id)
              onOverlayFeedChange(feed)
              overlayVisible.set(1)
            }}
            onDragUpdate={(currentY: number, targetIndex: number) => {
              overlayY.set(currentY)
              if (dragTargetIndexRef.current !== targetIndex) {
                dragTargetIndexRef.current = targetIndex
                forceUpdateForShift(n => n + 1)
              }
            }}
            onDragEnd={(didReorder: boolean) => {
              if (!didReorder) {
                isDraggingRef.current = false
                dragTargetIndexRef.current = -1
                setDraggedItem(null)
                setHiddenFeedId(null)
                overlayVisible.set(0)
              }
            }}
            onTogglePinned={() => {
              // Optimistically remove from local state immediately
              feedsRef.current = feedsRef.current.filter(
                f => f.config.id !== feed.config.id,
              )
              forceRender(n => n + 1)

              // Then update server in background
              updateSavedFeeds([
                {
                  ...feed.config,
                  pinned: false,
                },
              ])
            }}
            onReorder={onReorder}
          />
        )
      })}
    </View>
  )
})

// Separate component for discover/popular feeds - manages its own query subscription
// This prevents query updates from re-rendering FeedsScreen
function DiscoverFeedsSection({
  refetchRef,
  fetchMoreRef,
  listRef,
}: {
  refetchRef: React.MutableRefObject<(() => Promise<void>) | null>
  fetchMoreRef: React.MutableRefObject<(() => void) | null>
  listRef: React.RefObject<ListMethods | null>
}) {
  const {_} = useLingui()
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  const [query, setQuery] = React.useState('')

  const {
    data: popularFeeds,
    isFetching: isPopularFeedsFetching,
    error: popularFeedsError,
    refetch: refetchPopularFeeds,
    fetchNextPage: fetchNextPopularFeedsPage,
    isFetchingNextPage: isPopularFeedsFetchingNextPage,
    hasNextPage: hasNextPopularFeedsPage,
  } = useGetPopularFeedsQuery()

  const {
    data: searchResults,
    mutate: search,
    reset: resetSearch,
    isPending: isSearchPending,
    error: searchError,
  } = useSearchPopularFeedsMutation()

  const isUserSearching = query.length > 1
  const debouncedSearch = React.useMemo(
    () => debounce(q => search(q), 500),
    [search],
  )

  // Expose refetch for pull-to-refresh
  React.useEffect(() => {
    refetchRef.current = async () => {
      await refetchPopularFeeds()
    }
  }, [refetchRef, refetchPopularFeeds])

  // Expose fetchNextPage for infinite scroll
  React.useEffect(() => {
    fetchMoreRef.current = () => {
      if (
        hasNextPopularFeedsPage &&
        !isPopularFeedsFetchingNextPage &&
        !isUserSearching
      ) {
        fetchNextPopularFeedsPage()
      }
    }
  }, [
    fetchMoreRef,
    hasNextPopularFeedsPage,
    isPopularFeedsFetchingNextPage,
    isUserSearching,
    fetchNextPopularFeedsPage,
  ])

  const onChangeQuery = React.useCallback(
    (text: string) => {
      setQuery(text)
      if (text.length > 1) {
        debouncedSearch(text)
      } else {
        refetchPopularFeeds()
        resetSearch()
      }
    },
    [setQuery, refetchPopularFeeds, debouncedSearch, resetSearch],
  )

  const onPressCancelSearch = React.useCallback(() => {
    setQuery('')
    refetchPopularFeeds()
    resetSearch()
  }, [refetchPopularFeeds, setQuery, resetSearch])

  const onSubmitQuery = React.useCallback(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  const searchBarIndex = 0 // First item in this section
  const onChangeSearchFocus = React.useCallback(
    (focus: boolean) => {
      if (focus && listRef.current) {
        // Scroll to show discover section
        if (isNative) {
          listRef.current.scrollToIndex({
            index: searchBarIndex + 2, // Account for header items
            animated: true,
          })
        } else {
          const headerHeight = isMobile ? 43 : 53
          const feedItemHeight = isMobile ? 49 : 58
          listRef.current.scrollToOffset({
            offset: (searchBarIndex + 2) * feedItemHeight - headerHeight,
            animated: true,
          })
        }
      }
    },
    [listRef, isMobile],
  )

  // Render feeds list
  const feeds = React.useMemo(() => {
    if (isUserSearching) {
      return searchResults ?? []
    }
    if (!popularFeeds?.pages) return []
    return popularFeeds.pages.flatMap(page => page.feeds)
  }, [isUserSearching, searchResults, popularFeeds?.pages])

  const isLoading = isUserSearching
    ? isSearchPending || !searchResults
    : isPopularFeedsFetching && !popularFeeds?.pages

  const hasError = popularFeedsError || searchError
  const hasNoResults = isUserSearching
    ? searchResults?.length === 0
    : !popularFeeds?.pages

  return (
    <View>
      <FeedsAboutHeader />
      <View style={[a.px_md, isUserSearching ? a.pb_lg : a.pb_xs]}>
        <SearchInput
          placeholder={_(msg`Search feeds`)}
          value={query}
          onChangeText={onChangeQuery}
          onClearText={onPressCancelSearch}
          onSubmitEditing={onSubmitQuery}
          onFocus={() => onChangeSearchFocus(true)}
          onBlur={() => onChangeSearchFocus(false)}
        />
      </View>

      {hasError ? (
        <ErrorMessage
          message={cleanError(
            popularFeedsError?.toString() ?? searchError?.toString() ?? '',
          )}
        />
      ) : isLoading ? (
        <FeedFeedLoadingPlaceholder />
      ) : hasNoResults && !isUserSearching ? (
        <View style={{paddingHorizontal: 16, paddingTop: 10}}>
          <Text type="lg" style={pal.textLight}>
            <Trans>No feeds found</Trans>
          </Text>
        </View>
      ) : hasNoResults && isUserSearching ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: '150%',
          }}>
          <Text type="lg" style={pal.textLight}>
            <Trans>No results found for "{query}"</Trans>
          </Text>
        </View>
      ) : (
        <>
          {feeds.map(feed => (
            <View key={feed.uri} style={[a.px_lg, a.pt_lg, a.gap_lg]}>
              <FeedCard.Default view={feed} />
              <Divider />
            </View>
          ))}
          {isPopularFeedsFetchingNextPage && (
            <View style={s.p10}>
              <ActivityIndicator size="large" />
            </View>
          )}
          {!isUserSearching &&
            hasNextPopularFeedsPage &&
            !isPopularFeedsFetchingNextPage && (
              <Pressable
                accessibilityRole="button"
                onPress={() => fetchNextPopularFeedsPage()}
                style={[a.p_lg, a.align_center]}>
                <Text style={[a.text_md, {color: pal.colors.link}]}>
                  <Trans>Load more</Trans>
                </Text>
              </Pressable>
            )}
        </>
      )}
    </View>
  )
}

type EditableFeedItemProps = {
  savedFeed: SavedFeedItem
  isPinned: boolean
  pinnedIndex?: number
  pinnedCount?: number
  isBeingDragged: boolean
  shiftOffset: number
  scrollGesture: ReturnType<typeof Gesture.Native>
  itemHeightRef: React.RefObject<number>
  itemHeightShared: Animated.SharedValue<number>
  draggedCurrentY: Animated.SharedValue<number>
  onDragStart: (startY: number) => void
  onDragUpdate: (currentY: number, targetIndex: number) => void
  onDragEnd: (didReorder: boolean) => void
  onTogglePinned: () => Promise<void>
  onReorder: (fromIndex: number, toIndex: number) => void
}

function areEditableFeedItemPropsEqual(
  prev: EditableFeedItemProps,
  next: EditableFeedItemProps,
): boolean {
  return (
    prev.savedFeed.config.id === next.savedFeed.config.id &&
    prev.isPinned === next.isPinned &&
    prev.pinnedIndex === next.pinnedIndex &&
    prev.pinnedCount === next.pinnedCount &&
    prev.isBeingDragged === next.isBeingDragged &&
    prev.shiftOffset === next.shiftOffset
  )
}

const EditableFeedItem = React.memo(function EditableFeedItem({
  savedFeed,
  isPinned,
  pinnedIndex,
  pinnedCount,
  isBeingDragged,
  shiftOffset,
  scrollGesture,
  itemHeightRef,
  itemHeightShared,
  draggedCurrentY,
  onDragStart,
  onDragUpdate,
  onDragEnd,
  onTogglePinned,
  onReorder,
}: EditableFeedItemProps) {
  const t = useTheme()
  const {_} = useLingui()
  const playHaptic = useHaptics()

  const onDragStartRef = React.useRef(onDragStart)
  const onDragUpdateRef = React.useRef(onDragUpdate)
  const onDragEndRef = React.useRef(onDragEnd)
  const onReorderRef = React.useRef(onReorder)
  React.useEffect(() => {
    onDragStartRef.current = onDragStart
    onDragUpdateRef.current = onDragUpdate
    onDragEndRef.current = onDragEnd
    onReorderRef.current = onReorder
  })

  const [hovered, setHovered] = useState(false)
  const startY = useSharedValue(0)
  const startX = useSharedValue(0)
  const lastTentativeIndex = useSharedValue(-1)
  const isDragging = useSharedValue(false)
  const isActivated = useSharedValue(false)

  const handleDragStart = React.useCallback((y: number) => {
    onDragStartRef.current(y)
  }, [])
  const handleDragUpdate = React.useCallback((y: number, idx: number) => {
    onDragUpdateRef.current(y, idx)
  }, [])
  const handleDragEnd = React.useCallback((didReorder: boolean) => {
    onDragEndRef.current(didReorder)
  }, [])
  const handleReorder = React.useCallback((from: number, to: number) => {
    onReorderRef.current(from, to)
  }, [])

  const panGesture = useMemo(() => {
    if (!isPinned || pinnedIndex === undefined || pinnedCount === undefined) {
      return Gesture.Native()
    }

    return Gesture.Pan()
      .blocksExternalGesture(scrollGesture)
      .manualActivation(true)
      .onTouchesDown((evt, stateManager) => {
        'worklet'
        // Immediately show visual feedback on touch
        const touch = evt.allTouches[0]
        if (!touch) return
        startY.set(touch.absoluteY)
        startX.set(touch.absoluteX)
        draggedCurrentY.set(touch.absoluteY)
        lastTentativeIndex.set(pinnedIndex)
        isDragging.set(true)
        isActivated.set(false)
        runOnJS(playHaptic)()
        runOnJS(handleDragStart)(touch.absoluteY)
        // Begin tracking but don't activate yet
        stateManager.begin()
      })
      .onTouchesMove((evt, stateManager) => {
        'worklet'
        const touch = evt.allTouches[0]
        if (!touch) return

        const deltaY = Math.abs(touch.absoluteY - startY.get())
        const deltaX = Math.abs(touch.absoluteX - startX.get())

        // Fail if horizontal movement is too large
        if (deltaX > 20) {
          isDragging.set(false)
          runOnJS(handleDragEnd)(false)
          stateManager.fail()
          return
        }

        // Activate once we've moved 3px vertically
        if (deltaY >= 3) {
          isActivated.set(true)
          stateManager.activate()
        }
      })
      .onTouchesUp((_evt, stateManager) => {
        'worklet'
        // Only handle if gesture never activated (quick tap)
        // If activated, onEnd will handle it
        if (isDragging.get() && !isActivated.get()) {
          isDragging.set(false)
          runOnJS(handleDragEnd)(false)
        }
        stateManager.end()
      })
      .onUpdate(evt => {
        'worklet'
        const height = itemHeightShared.get()
        if (height === 0) return

        const maxUpward = pinnedIndex * height
        const maxDownward =
          (pinnedCount - 1 - pinnedIndex) * height + height * 0.5
        const deltaY = evt.absoluteY - startY.get()
        const clampedDeltaY = Math.max(
          -maxUpward,
          Math.min(maxDownward, deltaY),
        )
        const clampedY = startY.get() + clampedDeltaY

        draggedCurrentY.set(clampedY)

        const upwardBias = clampedDeltaY < 0 ? -height * 0.45 : 0
        const positionOffset = Math.round((clampedDeltaY + upwardBias) / height)
        const tentativeIndex = Math.max(
          0,
          Math.min(pinnedIndex + positionOffset, pinnedCount - 1),
        )

        if (tentativeIndex !== lastTentativeIndex.get()) {
          runOnJS(playHaptic)()
          lastTentativeIndex.set(tentativeIndex)
        }

        runOnJS(handleDragUpdate)(clampedY, tentativeIndex)
      })
      .onEnd(evt => {
        'worklet'
        const height = itemHeightShared.get()

        if (height === 0) {
          isDragging.set(false)
          runOnJS(handleDragEnd)(false)
          return
        }

        const maxUpward = pinnedIndex * height
        const maxDownward =
          (pinnedCount - 1 - pinnedIndex) * height + height * 0.5
        const deltaY = evt.absoluteY - startY.get()
        const clampedDeltaY = Math.max(
          -maxUpward,
          Math.min(maxDownward, deltaY),
        )

        const upwardBias = clampedDeltaY < 0 ? -height * 0.45 : 0
        const positionOffset = Math.round((clampedDeltaY + upwardBias) / height)
        const newIndex = Math.max(
          0,
          Math.min(pinnedIndex + positionOffset, pinnedCount - 1),
        )

        const didReorder = newIndex !== pinnedIndex
        isDragging.set(false)
        runOnJS(handleDragEnd)(didReorder)

        if (didReorder) {
          runOnJS(handleReorder)(pinnedIndex, newIndex)
        }
      })
      .onFinalize(() => {
        'worklet'
        // Final cleanup - only if gesture was never activated and is still dragging
        if (isDragging.get() && !isActivated.get()) {
          isDragging.set(false)
          runOnJS(handleDragEnd)(false)
        }
      })
  }, [
    isPinned,
    pinnedIndex,
    pinnedCount,
    scrollGesture,
    itemHeightShared,
    draggedCurrentY,
    isDragging,
    isActivated,
    playHaptic,
    handleDragStart,
    handleDragUpdate,
    handleDragEnd,
    handleReorder,
    startY,
    startX,
    lastTentativeIndex,
  ])

  const handleTogglePinned = async () => {
    playHaptic()
    await onTogglePinned()
  }

  const webHoverProps = isWeb
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }
    : {}

  return (
    <View
      style={[
        isBeingDragged && {opacity: 0},
        shiftOffset !== 0 && {transform: [{translateY: shiftOffset}]},
      ]}
      onLayout={e => {
        const height = e.nativeEvent.layout.height
        if (itemHeightRef.current === 0) {
          itemHeightRef.current = height
          itemHeightShared.set(height)
        }
      }}>
      <View
        {...(webHoverProps as any)}
        style={[
          a.flex_1,
          a.flex_row,
          a.align_center,
          isWeb && hovered && t.atoms.bg_contrast_25,
        ]}>
        {isPinned && <DragHandle gesture={panGesture} />}

        <View style={[a.flex_1, a.py_sm]}>
          <FeedItemContent savedFeed={savedFeed} />
        </View>

        <View style={[a.pr_md]}>
          <Button
            testID={`feed-${savedFeed.config.id}-togglePin`}
            label={_(msg`Unpin feed`)}
            onPress={handleTogglePinned}
            size="small"
            color="secondary"
            variant="ghost"
            shape="square">
            <ButtonIcon icon={XIcon} />
          </Button>
        </View>
      </View>
    </View>
  )
}, areEditableFeedItemPropsEqual)

function FeedItemContent({savedFeed}: {savedFeed: SavedFeedItem}) {
  const t = useTheme()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const setSelectedFeed = useSetSelectedFeed()

  if (savedFeed.type === 'timeline') {
    return (
      <Pressable
        testID="saved-feed-following"
        accessibilityRole="button"
        accessibilityLabel={_(msg`Following`)}
        accessibilityHint={_(msg`Opens your Following feed on Home`)}
        onPress={() => {
          setSelectedFeed('following')
          navigation.navigate('Home')
        }}
        style={[a.flex_1, a.align_start]}>
        <FeedCard.Header>
          <View
            style={[
              a.align_center,
              a.justify_center,
              {
                width: 28,
                height: 28,
                borderRadius: 3,
                backgroundColor: t.palette.primary_500,
              },
            ]}>
            <FilterTimeline
              style={{width: 18, height: 18}}
              fill={t.palette.white}
            />
          </View>
          <FeedCard.TitleAndByline
            title={_(msg({message: 'Following', context: 'feed-name'}))}
          />
        </FeedCard.Header>
      </Pressable>
    )
  }

  if (savedFeed.type === 'feed') {
    return (
      <FeedCard.Link
        testID={`saved-feed-${savedFeed.view.displayName}`}
        view={savedFeed.view}
        style={[a.flex_1, a.align_start]}>
        <FeedCard.Header>
          <FeedCard.Avatar src={savedFeed.view.avatar} size={28} />
          <FeedCard.TitleAndByline title={savedFeed.view.displayName} />
        </FeedCard.Header>
      </FeedCard.Link>
    )
  }

  // list type
  return (
    <ListCard.Link
      testID={`saved-feed-${savedFeed.view.name}`}
      view={savedFeed.view}
      style={[a.flex_1, a.align_start]}>
      <ListCard.Header>
        <ListCard.Avatar src={savedFeed.view.avatar} size={28} />
        <ListCard.TitleAndByline title={savedFeed.view.name} />
      </ListCard.Header>
    </ListCard.Link>
  )
}

function DragOverlay({
  savedFeed,
  currentY,
  visible,
}: {
  savedFeed: SavedFeedItem
  currentY: Animated.SharedValue<number>
  visible: Animated.SharedValue<number>
}) {
  const t = useTheme()
  const {isMobile} = useWebMediaQueries()

  // Position overlay at finger position, offset by half item height (~30px) to center it
  const animatedStyle = useAnimatedStyle(() => {
    const y = currentY.get()
    const isVisible = visible.get()
    return {
      top: y - 30,
      opacity: isVisible,
    }
  })

  return (
    <Animated.View
      style={[
        animatedStyle,
        a.mx_auto,
        {
          position: 'absolute',
          left: 0,
          right: 0,
          zIndex: 1000,
          maxWidth: isMobile ? undefined : 600,
        },
      ]}
      pointerEvents="none">
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.mx_lg,
          a.px_md,
          a.py_sm,
          a.rounded_sm,
          t.atoms.bg,
          {
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}>
        <FeedItemContent savedFeed={savedFeed} />
      </View>
    </Animated.View>
  )
}

function SavedFeedPlaceholder() {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_1,
        a.px_lg,
        a.py_md,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      <FeedCard.Header>
        <FeedCard.AvatarPlaceholder size={28} />
        <FeedCard.TitleAndBylinePlaceholder />
      </FeedCard.Header>
    </View>
  )
}

function DragHandle({
  gesture,
}: {
  gesture: ReturnType<typeof Gesture.Pan> | ReturnType<typeof Gesture.Native>
}) {
  const t = useTheme()
  const [hovered, setHovered] = useState(false)

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View>
        <Pressable
          accessible={false}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={[
            a.justify_center,
            a.pl_lg,
            a.pr_sm,
            a.py_xs,
            isWeb && ({cursor: 'grab'} as unknown as ViewStyle),
          ]}>
          <DragHandleIcon
            size="md"
            style={
              isWeb
                ? hovered
                  ? t.atoms.text_contrast_medium
                  : t.atoms.text_contrast_low
                : t.atoms.text_contrast_medium
            }
          />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  )
}

function FeedsSavedHeader() {
  const t = useTheme()

  return (
    <View style={[a.px_lg, a.pt_lg, a.pb_md, a.gap_xs]}>
      <Text style={[a.text_xl, a.font_bold, t.atoms.text]}>
        <Trans>Pinned Feeds</Trans>
      </Text>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        <Trans>Pinned feeds are shown as tabs on Home for easy access.</Trans>
      </Text>
    </View>
  )
}

function FeedsAboutHeader() {
  const t = useTheme()

  return (
    <View style={[a.px_lg, a.pt_xl, a.pb_md, a.gap_xs]}>
      <Text style={[a.text_xl, a.font_bold, t.atoms.text]}>
        <Trans>Discover New Feeds</Trans>
      </Text>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        <Trans>
          Choose your own timeline! Feeds built by the community help you find
          content you love.
        </Trans>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
})
