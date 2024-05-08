import React from 'react'
import {
  ActivityIndicator,
  type FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import debounce from 'lodash.debounce'

import {isNative, isWeb} from '#/platform/detection'
import {
  getAvatarTypeFromUri,
  useFeedSourceInfoQuery,
  useGetPopularFeedsQuery,
  useSearchPopularFeedsMutation,
} from '#/state/queries/feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useComposerControls} from '#/state/shell/composer'
import {HITSLOP_10} from 'lib/constants'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {CogIcon, ComposeIcon2, MagnifyingGlassIcon2} from 'lib/icons'
import {FeedsTabNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {cleanError} from 'lib/strings/errors'
import {s} from 'lib/styles'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {FAB} from 'view/com/util/fab/FAB'
import {SearchInput, SearchInputRef} from 'view/com/util/forms/SearchInput'
import {Link} from 'view/com/util/Link'
import {List} from 'view/com/util/List'
import {
  FeedFeedLoadingPlaceholder,
  LoadingPlaceholder,
} from 'view/com/util/LoadingPlaceholder'
import {Text} from 'view/com/util/text/Text'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {atoms as a, useTheme} from '#/alf'
import {IconCircle} from '#/components/IconCircle'
import {ListMagnifyingGlass_Stroke2_Corner0_Rounded} from '#/components/icons/ListMagnifyingGlass'
import {ListSparkle_Stroke2_Corner0_Rounded} from '#/components/icons/ListSparkle'

type Props = NativeStackScreenProps<FeedsTabNavigatorParams, 'Feeds'>

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
      type: 'savedFeedsLoading'
      key: string
      // pendingItems: number,
    }
  | {
      type: 'savedFeedNoResults'
      key: string
    }
  | {
      type: 'savedFeed'
      key: string
      feedUri: string
    }
  | {
      type: 'savedFeedsLoadMore'
      key: string
    }
  | {
      type: 'popularFeedsHeader'
      key: string
    }
  | {
      type: 'popularFeedsLoading'
      key: string
    }
  | {
      type: 'popularFeedsNoResults'
      key: string
    }
  | {
      type: 'popularFeed'
      key: string
      feedUri: string
    }
  | {
      type: 'popularFeedsLoadingMore'
      key: string
    }

// HACK
// the protocol doesn't yet tell us which feeds are personalized
// this list is used to filter out feed recommendations from logged out users
// for the ones we know need it
// -prf
const KNOWN_AUTHED_ONLY_FEEDS = [
  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends', // popular with friends, by bsky.app
  'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/mutuals', // mutuals, by skyfeed
  'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/only-posts', // only posts, by skyfeed
  'at://did:plc:wzsilnxf24ehtmmc3gssy5bu/app.bsky.feed.generator/mentions', // mentions, by flicknow
  'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/bangers', // my bangers, by jaz
  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/mutuals', // mutuals, by bluesky
  'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/my-followers', // followers, by jaz
  'at://did:plc:vpkhqolt662uhesyj6nxm7ys/app.bsky.feed.generator/followpics', // the gram, by why
]

export function FeedsScreen(_props: Props) {
  const pal = usePalette('default')
  const {openComposer} = useComposerControls()
  const {isMobile, isTabletOrDesktop} = useWebMediaQueries()
  const [query, setQuery] = React.useState('')
  const [isPTR, setIsPTR] = React.useState(false)
  const {
    data: preferences,
    isLoading: isPreferencesLoading,
    error: preferencesError,
    refetch: refetchPreferences,
  } = usePreferencesQuery()
  const {
    data: popularFeeds,
    isFetching: isPopularFeedsFetching,
    error: popularFeedsError,
    refetch: refetchPopularFeeds,
    fetchNextPage: fetchNextPopularFeedsPage,
    isFetchingNextPage: isPopularFeedsFetchingNextPage,
    hasNextPage: hasNextPopularFeedsPage,
  } = useGetPopularFeedsQuery()
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {
    data: searchResults,
    mutate: search,
    reset: resetSearch,
    isPending: isSearchPending,
    error: searchError,
  } = useSearchPopularFeedsMutation()
  const {hasSession} = useSession()
  const listRef = React.useRef<FlatList>(null)
  const searchInputRef = React.useRef<SearchInputRef>(null)

  /**
   * A search query is present. We may not have search results yet.
   */
  const isUserSearching = query.length > 1
  const debouncedSearch = React.useMemo(
    () => debounce(q => search(q), 500), // debounce for 500ms
    [search],
  )
  const onPressCompose = React.useCallback(() => {
    openComposer({})
  }, [openComposer])
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
  const onPullToRefresh = React.useCallback(async () => {
    setIsPTR(true)
    await Promise.all([
      refetchPreferences().catch(_e => undefined),
      refetchPopularFeeds().catch(_e => undefined),
    ])
    setIsPTR(false)
  }, [setIsPTR, refetchPreferences, refetchPopularFeeds])
  const onEndReached = React.useCallback(() => {
    if (
      isPopularFeedsFetching ||
      isUserSearching ||
      !hasNextPopularFeedsPage ||
      popularFeedsError
    )
      return
    fetchNextPopularFeedsPage()
  }, [
    isPopularFeedsFetching,
    isUserSearching,
    popularFeedsError,
    hasNextPopularFeedsPage,
    fetchNextPopularFeedsPage,
  ])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const items = React.useMemo(() => {
    let slices: FlatlistSlice[] = []

    if (hasSession) {
      slices.push({
        key: 'savedFeedsHeader',
        type: 'savedFeedsHeader',
      })

      if (preferencesError) {
        slices.push({
          key: 'savedFeedsError',
          type: 'error',
          error: cleanError(preferencesError.toString()),
        })
      } else {
        if (isPreferencesLoading || !preferences?.feeds?.saved) {
          slices.push({
            key: 'savedFeedsLoading',
            type: 'savedFeedsLoading',
            // pendingItems: this.rootStore.preferences.savedFeeds.length || 3,
          })
        } else {
          if (preferences?.feeds?.saved.length !== 0) {
            const {saved, pinned} = preferences.feeds

            slices = slices.concat(
              pinned.map(uri => ({
                key: `savedFeed:${uri}`,
                type: 'savedFeed',
                feedUri: uri,
              })),
            )

            slices = slices.concat(
              saved
                .filter(uri => !pinned.includes(uri))
                .map(uri => ({
                  key: `savedFeed:${uri}`,
                  type: 'savedFeed',
                  feedUri: uri,
                })),
            )
          }
        }
      }
    }

    slices.push({
      key: 'popularFeedsHeader',
      type: 'popularFeedsHeader',
    })

    if (popularFeedsError || searchError) {
      slices.push({
        key: 'popularFeedsError',
        type: 'error',
        error: cleanError(
          popularFeedsError?.toString() ?? searchError?.toString() ?? '',
        ),
      })
    } else {
      if (isUserSearching) {
        if (isSearchPending || !searchResults) {
          slices.push({
            key: 'popularFeedsLoading',
            type: 'popularFeedsLoading',
          })
        } else {
          if (!searchResults || searchResults?.length === 0) {
            slices.push({
              key: 'popularFeedsNoResults',
              type: 'popularFeedsNoResults',
            })
          } else {
            slices = slices.concat(
              searchResults.map(feed => ({
                key: `popularFeed:${feed.uri}`,
                type: 'popularFeed',
                feedUri: feed.uri,
              })),
            )
          }
        }
      } else {
        if (isPopularFeedsFetching && !popularFeeds?.pages) {
          slices.push({
            key: 'popularFeedsLoading',
            type: 'popularFeedsLoading',
          })
        } else {
          if (
            !popularFeeds?.pages ||
            popularFeeds?.pages[0]?.feeds?.length === 0
          ) {
            slices.push({
              key: 'popularFeedsNoResults',
              type: 'popularFeedsNoResults',
            })
          } else {
            for (const page of popularFeeds.pages || []) {
              slices = slices.concat(
                page.feeds
                  .filter(feed => {
                    if (
                      !hasSession &&
                      KNOWN_AUTHED_ONLY_FEEDS.includes(feed.uri)
                    ) {
                      return false
                    }
                    return !preferences?.feeds?.saved.includes(feed.uri)
                  })
                  .map(feed => ({
                    key: `popularFeed:${feed.uri}`,
                    type: 'popularFeed',
                    feedUri: feed.uri,
                  })),
              )
            }

            if (isPopularFeedsFetchingNextPage) {
              slices.push({
                key: 'popularFeedsLoadingMore',
                type: 'popularFeedsLoadingMore',
              })
            }
          }
        }
      }
    }

    return slices
  }, [
    hasSession,
    preferences,
    isPreferencesLoading,
    preferencesError,
    popularFeeds,
    isPopularFeedsFetching,
    popularFeedsError,
    isPopularFeedsFetchingNextPage,
    searchResults,
    isSearchPending,
    searchError,
    isUserSearching,
  ])

  const renderHeaderBtn = React.useCallback(() => {
    return (
      <View style={styles.headerBtnGroup}>
        <Pressable
          accessibilityRole="button"
          hitSlop={HITSLOP_10}
          onPress={searchInputRef.current?.focus}>
          <MagnifyingGlassIcon2
            size={22}
            strokeWidth={2}
            style={pal.textLight}
          />
        </Pressable>
        <Link
          href="/settings/saved-feeds"
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Edit Saved Feeds`)}
          accessibilityHint={_(msg`Opens screen to edit Saved Feeds`)}>
          <CogIcon size={22} strokeWidth={2} style={pal.textLight} />
        </Link>
      </View>
    )
  }, [pal, _])

  const searchBarIndex = items.findIndex(
    item => item.type === 'popularFeedsHeader',
  )

  const onChangeSearchFocus = React.useCallback(
    (focus: boolean) => {
      if (focus && searchBarIndex > -1) {
        if (isNative) {
          // scrollToIndex scrolls the exact right amount, so use if available
          listRef.current?.scrollToIndex({
            index: searchBarIndex,
            animated: true,
          })
        } else {
          // web implementation only supports scrollToOffset
          // thus, we calculate the offset based on the index
          // pixel values are estimates, I wasn't able to get it pixel perfect :(
          const headerHeight = isMobile ? 43 : 53
          const feedItemHeight = isMobile ? 49 : 58
          listRef.current?.scrollToOffset({
            offset: searchBarIndex * feedItemHeight - headerHeight,
            animated: true,
          })
        }
      }
    },
    [searchBarIndex, isMobile],
  )

  const renderItem = React.useCallback(
    ({item}: {item: FlatlistSlice}) => {
      if (item.type === 'error') {
        return <ErrorMessage message={item.error} />
      } else if (
        item.type === 'popularFeedsLoadingMore' ||
        item.type === 'savedFeedsLoading'
      ) {
        return (
          <View style={s.p10}>
            <ActivityIndicator size="large" />
          </View>
        )
      } else if (item.type === 'savedFeedsHeader') {
        return (
          <>
            {!isMobile && (
              <View
                style={[
                  pal.view,
                  styles.header,
                  pal.border,
                  {
                    borderBottomWidth: 1,
                  },
                ]}>
                <Text type="title-lg" style={[pal.text, s.bold]}>
                  <Trans>Feeds</Trans>
                </Text>
                <View style={styles.headerBtnGroup}>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={HITSLOP_10}
                    onPress={searchInputRef.current?.focus}>
                    <MagnifyingGlassIcon2
                      size={22}
                      strokeWidth={2}
                      style={pal.icon}
                    />
                  </Pressable>
                  <Link
                    href="/settings/saved-feeds"
                    accessibilityLabel={_(msg`Edit My Feeds`)}
                    accessibilityHint="">
                    <CogIcon strokeWidth={1.5} style={pal.icon} size={28} />
                  </Link>
                </View>
              </View>
            )}
            {preferences?.feeds?.saved?.length !== 0 && <FeedsSavedHeader />}
          </>
        )
      } else if (item.type === 'savedFeedNoResults') {
        return (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 10,
            }}>
            <Text type="lg" style={pal.textLight}>
              <Trans>You don't have any saved feeds!</Trans>
            </Text>
          </View>
        )
      } else if (item.type === 'savedFeed') {
        return <SavedFeed feedUri={item.feedUri} />
      } else if (item.type === 'popularFeedsHeader') {
        return (
          <>
            <FeedsAboutHeader />
            <View style={{paddingHorizontal: 12, paddingBottom: 12}}>
              <SearchInput
                ref={searchInputRef}
                query={query}
                onChangeQuery={onChangeQuery}
                onPressCancelSearch={onPressCancelSearch}
                onSubmitQuery={onSubmitQuery}
                setIsInputFocused={onChangeSearchFocus}
              />
            </View>
          </>
        )
      } else if (item.type === 'popularFeedsLoading') {
        return <FeedFeedLoadingPlaceholder />
      } else if (item.type === 'popularFeed') {
        return (
          <FeedSourceCard
            feedUri={item.feedUri}
            showSaveBtn={hasSession}
            showDescription
            showLikes
            pinOnSave
          />
        )
      } else if (item.type === 'popularFeedsNoResults') {
        return (
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
        )
      }
      return null
    },
    [
      isMobile,
      pal.view,
      pal.border,
      pal.text,
      pal.icon,
      pal.textLight,
      _,
      preferences?.feeds?.saved?.length,
      query,
      onChangeQuery,
      onPressCancelSearch,
      onSubmitQuery,
      onChangeSearchFocus,
      hasSession,
    ],
  )

  return (
    <View style={[pal.view, styles.container]}>
      {isMobile && (
        <ViewHeader
          title={_(msg`Feeds`)}
          canGoBack={false}
          renderButton={renderHeaderBtn}
          showBorder
        />
      )}

      <List
        ref={listRef}
        style={[!isTabletOrDesktop && s.flex1, styles.list]}
        data={items}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.contentContainer}
        renderItem={renderItem}
        refreshing={isPTR}
        onRefresh={isUserSearching ? undefined : onPullToRefresh}
        initialNumToRender={10}
        onEndReached={onEndReached}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight
        scrollIndicatorInsets={{right: 1}}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg`New post`)}
          accessibilityHint=""
        />
      )}
    </View>
  )
}

function SavedFeed({feedUri}: {feedUri: string}) {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  const {data: info, error} = useFeedSourceInfoQuery({uri: feedUri})
  const typeAvatar = getAvatarTypeFromUri(feedUri)

  if (!info)
    return (
      <SavedFeedLoadingPlaceholder
        key={`savedFeedLoadingPlaceholder:${feedUri}`}
      />
    )

  return (
    <Link
      testID={`saved-feed-${info.displayName}`}
      href={info.route.href}
      style={[pal.border, styles.savedFeed, isMobile && styles.savedFeedMobile]}
      hoverStyle={pal.viewLight}
      accessibilityLabel={info.displayName}
      accessibilityHint=""
      asAnchor
      anchorNoUnderline>
      {error ? (
        <View
          style={{width: 28, flexDirection: 'row', justifyContent: 'center'}}>
          <FontAwesomeIcon
            icon="exclamation-circle"
            color={pal.colors.textLight}
          />
        </View>
      ) : (
        <UserAvatar type={typeAvatar} size={28} avatar={info.avatar} />
      )}
      <View
        style={{flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center'}}>
        <Text type="lg-medium" style={pal.text} numberOfLines={1}>
          {info.displayName}
        </Text>
        {error ? (
          <View style={[styles.offlineSlug, pal.borderDark]}>
            <Text type="xs" style={pal.textLight}>
              <Trans>Feed offline</Trans>
            </Text>
          </View>
        ) : null}
      </View>
      {isMobile && (
        <FontAwesomeIcon
          icon="chevron-right"
          size={14}
          style={pal.textLight as FontAwesomeIconStyle}
        />
      )}
    </Link>
  )
}

function SavedFeedLoadingPlaceholder() {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  return (
    <View
      style={[
        pal.border,
        styles.savedFeed,
        isMobile && styles.savedFeedMobile,
      ]}>
      <LoadingPlaceholder width={28} height={28} style={{borderRadius: 4}} />
      <LoadingPlaceholder width={140} height={12} />
    </View>
  )
}

function FeedsSavedHeader() {
  const t = useTheme()

  return (
    <View
      style={
        isWeb
          ? [
              a.flex_row,
              a.px_md,
              a.py_lg,
              a.gap_md,
              a.border_b,
              t.atoms.border_contrast_low,
            ]
          : [
              {flexDirection: 'row-reverse'},
              a.p_lg,
              a.gap_md,
              a.border_b,
              t.atoms.border_contrast_low,
            ]
      }>
      <IconCircle icon={ListSparkle_Stroke2_Corner0_Rounded} size="lg" />
      <View style={[a.flex_1, a.gap_xs]}>
        <Text style={[a.flex_1, a.text_2xl, a.font_bold, t.atoms.text]}>
          <Trans>My Feeds</Trans>
        </Text>
        <Text style={[t.atoms.text_contrast_high]}>
          <Trans>All the feeds you've saved, right in one place.</Trans>
        </Text>
      </View>
    </View>
  )
}

function FeedsAboutHeader() {
  const t = useTheme()

  return (
    <View
      style={
        isWeb
          ? [a.flex_row, a.px_md, a.pt_lg, a.pb_lg, a.gap_md]
          : [{flexDirection: 'row-reverse'}, a.p_lg, a.gap_md]
      }>
      <IconCircle
        icon={ListMagnifyingGlass_Stroke2_Corner0_Rounded}
        size="lg"
      />
      <View style={[a.flex_1, a.gap_sm]}>
        <Text style={[a.flex_1, a.text_2xl, a.font_bold, t.atoms.text]}>
          <Trans>Discover New Feeds</Trans>
        </Text>
        <Text style={[t.atoms.text_contrast_high]}>
          <Trans>
            Custom feeds built by the community bring you new experiences and
            help you find the content you love.
          </Trans>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    height: '100%',
  },
  contentContainer: {
    paddingBottom: 100,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  savedFeed: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  savedFeedMobile: {
    paddingVertical: 10,
  },
  offlineSlug: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  headerBtnGroup: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
})
