import React from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import {AppBskyActorDefs, AppBskyFeedDefs, moderateProfile} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {useAnalytics} from '#/lib/analytics/analytics'
import {HITSLOP_10} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {MagnifyingGlassIcon} from '#/lib/icons'
import {NavigationProp} from '#/lib/routes/types'
import {augmentSearchQuery} from '#/lib/strings/helpers'
import {s} from '#/lib/styles'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {useActorSearch} from '#/state/queries/actor-search'
import {useModerationOpts} from '#/state/queries/preferences'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {useSuggestedFollowsQuery} from '#/state/queries/suggested-follows'
import {useSession} from '#/state/session'
import {useSetDrawerOpen} from '#/state/shell'
import {useSetDrawerSwipeDisabled, useSetMinimalShellMode} from '#/state/shell'
import {useNonReactiveCallback} from 'lib/hooks/useNonReactiveCallback'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {
  NativeStackScreenProps,
  SearchTabNavigatorParams,
} from 'lib/routes/types'
import {useTheme} from 'lib/ThemeContext'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {Post} from '#/view/com/post/Post'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {List} from '#/view/com/util/List'
import {Text} from '#/view/com/util/text/Text'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {
  MATCH_HANDLE,
  SearchLinkCard,
  SearchProfileCard,
} from '#/view/shell/desktop/Search'
import {ProfileCardFeedLoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'
import {atoms as a} from '#/alf'

function Loader() {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  return (
    <CenteredView
      style={[
        // @ts-ignore web only -prf
        {
          padding: 18,
          height: isWeb ? '100vh' : undefined,
        },
        pal.border,
      ]}
      sideBorders={!isMobile}>
      <ActivityIndicator />
    </CenteredView>
  )
}

function EmptyState({message, error}: {message: string; error?: string}) {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()

  return (
    <CenteredView
      sideBorders={!isMobile}
      style={[
        pal.border,
        // @ts-ignore web only -prf
        {
          padding: 18,
          height: isWeb ? '100vh' : undefined,
        },
      ]}>
      <View style={[pal.viewLight, {padding: 18, borderRadius: 8}]}>
        <Text style={[pal.text]}>{message}</Text>

        {error && (
          <>
            <View
              style={[
                {
                  marginVertical: 12,
                  height: 1,
                  width: '100%',
                  backgroundColor: pal.text.color,
                  opacity: 0.2,
                },
              ]}
            />

            <Text style={[pal.textLight]}>
              <Trans>Error:</Trans> {error}
            </Text>
          </>
        )}
      </View>
    </CenteredView>
  )
}

function useSuggestedFollows(): [
  AppBskyActorDefs.ProfileViewBasic[],
  () => void,
] {
  const {
    data: suggestions,
    hasNextPage,
    isFetchingNextPage,
    isError,
    fetchNextPage,
  } = useSuggestedFollowsQuery()

  const onEndReached = React.useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more suggested follows', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  const items: AppBskyActorDefs.ProfileViewBasic[] = []
  if (suggestions) {
    // Currently the responses contain duplicate items.
    // Needs to be fixed on backend, but let's dedupe to be safe.
    let seen = new Set()
    for (const page of suggestions.pages) {
      for (const actor of page.actors) {
        if (!seen.has(actor.did)) {
          seen.add(actor.did)
          items.push(actor)
        }
      }
    }
  }
  return [items, onEndReached]
}

function SearchScreenSuggestedFollows() {
  const pal = usePalette('default')
  const [suggestions, onEndReached] = useSuggestedFollows()

  return suggestions.length ? (
    <List
      data={suggestions}
      renderItem={({item}) => <ProfileCardWithFollowBtn profile={item} noBg />}
      keyExtractor={item => item.did}
      // @ts-ignore web only -prf
      desktopFixedHeight
      contentContainerStyle={{paddingBottom: 200}}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onEndReached={onEndReached}
      onEndReachedThreshold={2}
    />
  ) : (
    <CenteredView sideBorders style={[pal.border, s.hContentRegion]}>
      <ProfileCardFeedLoadingPlaceholder />
      <ProfileCardFeedLoadingPlaceholder />
    </CenteredView>
  )
}

type SearchResultSlice =
  | {
      type: 'post'
      key: string
      post: AppBskyFeedDefs.PostView
    }
  | {
      type: 'loadingMore'
      key: string
    }

function SearchScreenPostResults({
  query,
  sort,
  active,
}: {
  query: string
  sort?: 'top' | 'latest'
  active: boolean
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const [isPTR, setIsPTR] = React.useState(false)

  const augmentedQuery = React.useMemo(() => {
    return augmentSearchQuery(query || '', {did: currentAccount?.did})
  }, [query, currentAccount])

  const {
    isFetched,
    data: results,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useSearchPostsQuery({query: augmentedQuery, sort, enabled: active})

  const onPullToRefresh = React.useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [setIsPTR, refetch])
  const onEndReached = React.useCallback(() => {
    if (isFetching || !hasNextPage || error) return
    fetchNextPage()
  }, [isFetching, error, hasNextPage, fetchNextPage])

  const posts = React.useMemo(() => {
    return results?.pages.flatMap(page => page.posts) || []
  }, [results])
  const items = React.useMemo(() => {
    let temp: SearchResultSlice[] = []

    const seenUris = new Set()
    for (const post of posts) {
      if (seenUris.has(post.uri)) {
        continue
      }
      temp.push({
        type: 'post',
        key: post.uri,
        post,
      })
      seenUris.add(post.uri)
    }

    if (isFetchingNextPage) {
      temp.push({
        type: 'loadingMore',
        key: 'loadingMore',
      })
    }

    return temp
  }, [posts, isFetchingNextPage])

  return error ? (
    <EmptyState
      message={_(
        msg`We're sorry, but your search could not be completed. Please try again in a few minutes.`,
      )}
      error={error.toString()}
    />
  ) : (
    <>
      {isFetched ? (
        <>
          {posts.length ? (
            <List
              data={items}
              renderItem={({item}) => {
                if (item.type === 'post') {
                  return <Post post={item.post} />
                } else {
                  return <Loader />
                }
              }}
              keyExtractor={item => item.key}
              refreshing={isPTR}
              onRefresh={onPullToRefresh}
              onEndReached={onEndReached}
              // @ts-ignore web only -prf
              desktopFixedHeight
              contentContainerStyle={{paddingBottom: 100}}
            />
          ) : (
            <EmptyState message={_(msg`No results found for ${query}`)} />
          )}
        </>
      ) : (
        <Loader />
      )}
    </>
  )
}

function SearchScreenUserResults({
  query,
  active,
}: {
  query: string
  active: boolean
}) {
  const {_} = useLingui()

  const {data: results, isFetched} = useActorSearch({
    query: query,
    enabled: active,
  })

  return isFetched && results ? (
    <>
      {results.length ? (
        <List
          data={results}
          renderItem={({item}) => (
            <ProfileCardWithFollowBtn profile={item} noBg />
          )}
          keyExtractor={item => item.did}
          // @ts-ignore web only -prf
          desktopFixedHeight
          contentContainerStyle={{paddingBottom: 100}}
        />
      ) : (
        <EmptyState message={_(msg`No results found for ${query}`)} />
      )}
    </>
  ) : (
    <Loader />
  )
}

export function SearchScreenInner({query}: {query?: string}) {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
  const {hasSession} = useSession()
  const {isDesktop} = useWebMediaQueries()
  const [activeTab, setActiveTab] = React.useState(0)
  const {_} = useLingui()

  const onPageSelected = React.useCallback(
    (index: number) => {
      setMinimalShellMode(false)
      setDrawerSwipeDisabled(index > 0)
      setActiveTab(index)
    },
    [setDrawerSwipeDisabled, setMinimalShellMode],
  )

  const sections = React.useMemo(() => {
    if (!query) return []
    return [
      {
        title: _(msg`Top`),
        component: (
          <SearchScreenPostResults
            query={query}
            sort="top"
            active={activeTab === 0}
          />
        ),
      },
      {
        title: _(msg`Latest`),
        component: (
          <SearchScreenPostResults
            query={query}
            sort="latest"
            active={activeTab === 1}
          />
        ),
      },
      {
        title: _(msg`People`),
        component: (
          <SearchScreenUserResults query={query} active={activeTab === 2} />
        ),
      },
    ]
  }, [_, query, activeTab])

  return query ? (
    <Pager
      onPageSelected={onPageSelected}
      renderTabBar={props => (
        <CenteredView
          sideBorders
          style={[pal.border, pal.view, styles.tabBarContainer]}>
          <TabBar items={sections.map(section => section.title)} {...props} />
        </CenteredView>
      )}
      initialPage={0}>
      {sections.map((section, i) => (
        <View key={i}>{section.component}</View>
      ))}
    </Pager>
  ) : hasSession ? (
    <View>
      <CenteredView sideBorders style={pal.border}>
        <Text
          type="title"
          style={[
            pal.text,
            pal.border,
            {
              display: 'flex',
              paddingVertical: 12,
              paddingHorizontal: 18,
              fontWeight: 'bold',
            },
          ]}>
          <Trans>Suggested Follows</Trans>
        </Text>
      </CenteredView>

      <SearchScreenSuggestedFollows />
    </View>
  ) : (
    <CenteredView sideBorders style={pal.border}>
      <View
        // @ts-ignore web only -esb
        style={{
          height: Platform.select({web: '100vh'}),
        }}>
        {isDesktop && (
          <Text
            type="title"
            style={[
              pal.text,
              pal.border,
              {
                display: 'flex',
                paddingVertical: 12,
                paddingHorizontal: 18,
                fontWeight: 'bold',
                borderBottomWidth: 1,
              },
            ]}>
            <Trans>Search</Trans>
          </Text>
        )}

        <View
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 30,
            gap: 15,
          }}>
          <MagnifyingGlassIcon
            strokeWidth={3}
            size={isDesktop ? 60 : 60}
            style={pal.textLight}
          />
          <Text type="xl" style={[pal.textLight, {paddingHorizontal: 18}]}>
            <Trans>Find posts and users on Bluesky</Trans>
          </Text>
        </View>
      </View>
    </CenteredView>
  )
}

export function SearchScreen(
  props: NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>,
) {
  const navigation = useNavigation<NavigationProp>()
  const theme = useTheme()
  const textInput = React.useRef<TextInput>(null)
  const {_} = useLingui()
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const setDrawerOpen = useSetDrawerOpen()
  const moderationOpts = useModerationOpts()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {isTabletOrDesktop, isTabletOrMobile} = useWebMediaQueries()

  // Query terms
  const queryParam = props.route?.params?.q ?? ''
  const [searchText, setSearchText] = React.useState<string>(queryParam)
  const {data: autocompleteData, isFetching: isAutocompleteFetching} =
    useActorAutocompleteQuery(searchText, true)

  const [showAutocomplete, setShowAutocomplete] = React.useState(false)
  const [searchHistory, setSearchHistory] = React.useState<string[]>([])

  useFocusEffect(
    useNonReactiveCallback(() => {
      if (isWeb) {
        setSearchText(queryParam)
      }
    }),
  )

  React.useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const history = await AsyncStorage.getItem('searchHistory')
        if (history !== null) {
          setSearchHistory(JSON.parse(history))
        }
      } catch (e: any) {
        logger.error('Failed to load search history', {message: e})
      }
    }

    loadSearchHistory()
  }, [])

  const onPressMenu = React.useCallback(() => {
    track('ViewHeader:MenuButtonClicked')
    setDrawerOpen(true)
  }, [track, setDrawerOpen])

  const onPressClearQuery = React.useCallback(() => {
    scrollToTopWeb()
    setSearchText('')
    textInput.current?.focus()
  }, [])

  const onPressCancelSearch = React.useCallback(() => {
    scrollToTopWeb()

    if (showAutocomplete) {
      textInput.current?.blur()
      setShowAutocomplete(false)
      setSearchText(queryParam)
    } else {
      // If we just `setParams` and set `q` to an empty string, the URL still displays `q=`, which isn't pretty.
      // However, `.replace()` on native has a "push" animation that we don't want. So we need to handle these
      // differently.
      if (isWeb) {
        navigation.replace('Search', {})
      } else {
        setSearchText('')
        navigation.setParams({q: ''})
      }
    }
  }, [showAutocomplete, navigation, queryParam])

  const onChangeText = React.useCallback(async (text: string) => {
    scrollToTopWeb()
    setSearchText(text)
  }, [])

  const updateSearchHistory = React.useCallback(
    async (newQuery: string) => {
      newQuery = newQuery.trim()
      if (newQuery) {
        let newHistory = [
          newQuery,
          ...searchHistory.filter(q => q !== newQuery),
        ]

        if (newHistory.length > 5) {
          newHistory = newHistory.slice(0, 5)
        }

        setSearchHistory(newHistory)
        try {
          await AsyncStorage.setItem(
            'searchHistory',
            JSON.stringify(newHistory),
          )
        } catch (e: any) {
          logger.error('Failed to save search history', {message: e})
        }
      }
    },
    [searchHistory, setSearchHistory],
  )

  const navigateToItem = React.useCallback(
    (item: string) => {
      scrollToTopWeb()
      setShowAutocomplete(false)
      updateSearchHistory(item)

      if (isWeb) {
        navigation.push('Search', {q: item})
      } else {
        textInput.current?.blur()
        navigation.setParams({q: item})
      }
    },
    [updateSearchHistory, navigation],
  )

  const onSubmit = React.useCallback(() => {
    navigateToItem(searchText)
  }, [navigateToItem, searchText])

  const handleHistoryItemClick = (item: string) => {
    setSearchText(item)
    navigateToItem(item)
  }

  const onSoftReset = React.useCallback(() => {
    scrollToTopWeb()
    onPressCancelSearch()
  }, [onPressCancelSearch])

  const queryMaybeHandle = React.useMemo(() => {
    const match = MATCH_HANDLE.exec(queryParam)
    return match && match[1]
  }, [queryParam])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      return listenSoftReset(onSoftReset)
    }, [onSoftReset, setMinimalShellMode]),
  )

  const handleRemoveHistoryItem = (itemToRemove: string) => {
    const updatedHistory = searchHistory.filter(item => item !== itemToRemove)
    setSearchHistory(updatedHistory)
    AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory)).catch(
      e => {
        logger.error('Failed to update search history', {message: e})
      },
    )
  }

  return (
    <View style={isWeb ? null : {flex: 1}}>
      <CenteredView
        style={[
          styles.header,
          pal.border,
          pal.view,
          isTabletOrDesktop && {paddingTop: 10},
        ]}
        sideBorders={isTabletOrDesktop}>
        {isTabletOrMobile && (
          <Pressable
            testID="viewHeaderBackOrMenuBtn"
            onPress={onPressMenu}
            hitSlop={HITSLOP_10}
            style={styles.headerMenuBtn}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Menu`)}
            accessibilityHint={_(msg`Access navigation links and settings`)}>
            <FontAwesomeIcon
              icon="bars"
              size={18}
              color={pal.colors.textLight}
            />
          </Pressable>
        )}

        <View
          style={[
            {backgroundColor: pal.colors.backgroundLight},
            styles.headerSearchContainer,
          ]}>
          <MagnifyingGlassIcon
            style={[pal.icon, styles.headerSearchIcon]}
            size={21}
          />
          <TextInput
            testID="searchTextInput"
            ref={textInput}
            placeholder={_(msg`Search`)}
            placeholderTextColor={pal.colors.textLight}
            selectTextOnFocus={isNative}
            returnKeyType="search"
            value={searchText}
            style={[pal.text, styles.headerSearchInput]}
            keyboardAppearance={theme.colorScheme}
            onFocus={() => {
              if (isWeb) {
                // Prevent a jump on iPad by ensuring that
                // the initial focused render has no result list.
                requestAnimationFrame(() => {
                  setShowAutocomplete(true)
                })
              } else {
                setShowAutocomplete(true)
              }
            }}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            autoFocus={false}
            accessibilityRole="search"
            accessibilityLabel={_(msg`Search`)}
            accessibilityHint=""
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="none"
          />
          {showAutocomplete ? (
            <Pressable
              testID="searchTextInputClearBtn"
              onPress={onPressClearQuery}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Clear search query`)}
              accessibilityHint=""
              hitSlop={HITSLOP_10}>
              <FontAwesomeIcon
                icon="xmark"
                size={16}
                style={pal.textLight as FontAwesomeIconStyle}
              />
            </Pressable>
          ) : undefined}
        </View>

        {(queryParam || showAutocomplete) && (
          <View style={styles.headerCancelBtn}>
            <Pressable
              onPress={onPressCancelSearch}
              accessibilityRole="button"
              hitSlop={HITSLOP_10}>
              <Text style={[pal.text]}>
                <Trans>Cancel</Trans>
              </Text>
            </Pressable>
          </View>
        )}
      </CenteredView>

      {showAutocomplete && searchText.length > 0 ? (
        <>
          {(isAutocompleteFetching && !autocompleteData?.length) ||
          !moderationOpts ? (
            <Loader />
          ) : (
            <ScrollView
              style={{height: '100%'}}
              // @ts-ignore web only -prf
              dataSet={{stableGutters: '1'}}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag">
              <SearchLinkCard
                label={_(msg`Search for "${searchText}"`)}
                onPress={isNative ? onSubmit : undefined}
                to={
                  isNative
                    ? undefined
                    : `/search?q=${encodeURIComponent(searchText)}`
                }
                style={{borderBottomWidth: 1}}
              />

              {queryMaybeHandle ? (
                <SearchLinkCard
                  label={_(msg`Go to @${queryMaybeHandle}`)}
                  to={`/profile/${queryMaybeHandle}`}
                />
              ) : null}

              {autocompleteData?.map(item => (
                <SearchProfileCard
                  key={item.did}
                  profile={item}
                  moderation={moderateProfile(item, moderationOpts)}
                  onPress={() => {
                    if (isWeb) {
                      setShowAutocomplete(false)
                    } else {
                      textInput.current?.blur()
                    }
                  }}
                />
              ))}

              <View style={{height: 200}} />
            </ScrollView>
          )}
        </>
      ) : !queryParam && showAutocomplete ? (
        <CenteredView
          sideBorders={isTabletOrDesktop}
          // @ts-ignore web only -prf
          style={{
            height: isWeb ? '100vh' : undefined,
          }}>
          <View style={styles.searchHistoryContainer}>
            {searchHistory.length > 0 && (
              <View style={styles.searchHistoryContent}>
                <Text style={[pal.text, styles.searchHistoryTitle]}>
                  <Trans>Recent Searches</Trans>
                </Text>
                {searchHistory.map((historyItem, index) => (
                  <View
                    key={index}
                    style={[
                      a.flex_row,
                      a.mt_md,
                      a.justify_center,
                      a.justify_between,
                    ]}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleHistoryItemClick(historyItem)}
                      style={[a.flex_1, a.py_sm]}>
                      <Text style={pal.text}>{historyItem}</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleRemoveHistoryItem(historyItem)}
                      style={[a.px_md, a.py_xs, a.justify_center]}>
                      <FontAwesomeIcon
                        icon="xmark"
                        size={16}
                        style={pal.textLight as FontAwesomeIconStyle}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </CenteredView>
      ) : (
        <SearchScreenInner query={queryParam} />
      )}
    </View>
  )
}

function scrollToTopWeb() {
  if (isWeb) {
    window.scrollTo(0, 0)
  }
}

const HEADER_HEIGHT = 50

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    height: HEADER_HEIGHT,
    // @ts-ignore web only
    position: isWeb ? 'sticky' : '',
    top: 0,
    zIndex: 1,
  },
  headerMenuBtn: {
    width: 30,
    height: 30,
    borderRadius: 30,
    marginRight: 6,
    paddingBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerSearchIcon: {
    marginRight: 6,
    alignSelf: 'center',
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 17,
  },
  headerCancelBtn: {
    paddingLeft: 10,
  },
  tabBarContainer: {
    // @ts-ignore web only
    position: isWeb ? 'sticky' : '',
    top: isWeb ? HEADER_HEIGHT : 0,
    zIndex: 1,
  },
  searchHistoryContainer: {
    width: '100%',
    paddingHorizontal: 12,
  },
  searchHistoryContent: {
    padding: 10,
    borderRadius: 8,
  },
  searchHistoryTitle: {
    fontWeight: 'bold',
  },
})
