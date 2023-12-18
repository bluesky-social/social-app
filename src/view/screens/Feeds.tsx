import React from 'react'
import {ActivityIndicator, StyleSheet, View, RefreshControl} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {FAB} from 'view/com/util/fab/FAB'
import {Link} from 'view/com/util/Link'
import {NativeStackScreenProps, FeedsTabNavigatorParams} from 'lib/routes/types'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {ComposeIcon2, CogIcon} from 'lib/icons'
import {s} from 'lib/styles'
import {SearchInput} from 'view/com/util/forms/SearchInput'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {
  LoadingPlaceholder,
  FeedFeedLoadingPlaceholder,
} from 'view/com/util/LoadingPlaceholder'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import debounce from 'lodash.debounce'
import {Text} from 'view/com/util/text/Text'
import {List} from 'view/com/util/List'
import {useFocusEffect} from '@react-navigation/native'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSetMinimalShellMode} from '#/state/shell'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {
  useFeedSourceInfoQuery,
  useGetPopularFeedsQuery,
  useSearchPopularFeedsMutation,
} from '#/state/queries/feed'
import {cleanError} from 'lib/strings/errors'
import {useComposerControls} from '#/state/shell/composer'
import {useSession} from '#/state/session'

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
    await refetchPopularFeeds()
    setIsPTR(false)
  }, [setIsPTR, refetchPopularFeeds])
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
          if (preferences?.feeds?.saved.length === 0) {
            slices.push({
              key: 'savedFeedNoResults',
              type: 'savedFeedNoResults',
            })
          } else {
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
                  .filter(feed => !preferences?.feeds?.saved.includes(feed.uri))
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
      <Link
        href="/settings/saved-feeds"
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Edit Saved Feeds`)}
        accessibilityHint="Opens screen to edit Saved Feeds">
        <CogIcon size={22} strokeWidth={2} style={pal.textLight} />
      </Link>
    )
  }, [pal, _])

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
            <ActivityIndicator />
          </View>
        )
      } else if (item.type === 'savedFeedsHeader') {
        if (!isMobile) {
          return (
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
                <Trans>My Feeds</Trans>
              </Text>
              <Link
                href="/settings/saved-feeds"
                accessibilityLabel={_(msg`Edit My Feeds`)}
                accessibilityHint="">
                <CogIcon strokeWidth={1.5} style={pal.icon} size={28} />
              </Link>
            </View>
          )
        }
        return <View />
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
            <View
              style={[
                pal.view,
                styles.header,
                {
                  // This is first in the flatlist without a session -esb
                  marginTop: hasSession ? 16 : 0,
                  paddingLeft: isMobile ? 12 : undefined,
                  paddingRight: 10,
                  paddingBottom: isMobile ? 6 : undefined,
                },
              ]}>
              <Text type="title-lg" style={[pal.text, s.bold]}>
                <Trans>Discover new feeds</Trans>
              </Text>

              {!isMobile && (
                <SearchInput
                  query={query}
                  onChangeQuery={onChangeQuery}
                  onPressCancelSearch={onPressCancelSearch}
                  onSubmitQuery={onSubmitQuery}
                  style={{flex: 1, maxWidth: 250}}
                />
              )}
            </View>

            {isMobile && (
              <View style={{paddingHorizontal: 8, paddingBottom: 10}}>
                <SearchInput
                  query={query}
                  onChangeQuery={onChangeQuery}
                  onPressCancelSearch={onPressCancelSearch}
                  onSubmitQuery={onSubmitQuery}
                />
              </View>
            )}
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
      _,
      hasSession,
      isMobile,
      pal,
      query,
      onChangeQuery,
      onPressCancelSearch,
      onSubmitQuery,
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

      {preferences ? <View /> : <ActivityIndicator />}

      <List
        style={[!isTabletOrDesktop && s.flex1, styles.list]}
        data={items}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.contentContainer}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isPTR}
            onRefresh={isUserSearching ? undefined : onPullToRefresh}
            tintColor={pal.colors.text}
            titleColor={pal.colors.text}
          />
        }
        initialNumToRender={10}
        onEndReached={onEndReached}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight
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
        <UserAvatar type="algo" size={28} avatar={info.avatar} />
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
    paddingHorizontal: 16,
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
})
