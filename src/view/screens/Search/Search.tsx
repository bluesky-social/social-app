import React from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Pressable,
  Platform,
} from 'react-native'
import {ScrollView, CenteredView} from '#/view/com/util/Views'
import {List} from '#/view/com/util/List'
import {AppBskyActorDefs, AppBskyFeedDefs, moderateProfile} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {logger} from '#/logger'
import {
  NativeStackScreenProps,
  SearchTabNavigatorParams,
} from 'lib/routes/types'
import {Text} from '#/view/com/util/text/Text'
import {ProfileCardFeedLoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {Post} from '#/view/com/post/Post'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {HITSLOP_10} from '#/lib/constants'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {usePalette} from '#/lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {useSession} from '#/state/session'
import {useGetSuggestedFollowersByActor} from '#/state/queries/suggested-follows'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {useActorSearch} from '#/state/queries/actor-search'
import {useActorAutocompleteFn} from '#/state/queries/actor-autocomplete'
import {useSetDrawerOpen} from '#/state/shell'
import {useAnalytics} from '#/lib/analytics/analytics'
import {MagnifyingGlassIcon} from '#/lib/icons'
import {useModerationOpts} from '#/state/queries/preferences'
import {
  MATCH_HANDLE,
  SearchLinkCard,
  SearchProfileCard,
} from '#/view/shell/desktop/Search'
import {useSetMinimalShellMode, useSetDrawerSwipeDisabled} from '#/state/shell'
import {isNative, isWeb} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {s} from '#/lib/styles'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {augmentSearchQuery} from '#/lib/strings/helpers'
import {NavigationProp} from '#/lib/routes/types'

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

function SearchScreenSuggestedFollows() {
  const pal = usePalette('default')
  const {currentAccount} = useSession()
  const [suggestions, setSuggestions] = React.useState<
    AppBskyActorDefs.ProfileViewBasic[]
  >([])
  const getSuggestedFollowsByActor = useGetSuggestedFollowersByActor()

  React.useEffect(() => {
    async function getSuggestions() {
      const friends = await getSuggestedFollowsByActor(
        currentAccount!.did,
      ).then(friendsRes => friendsRes.suggestions)

      if (!friends) return // :(

      const friendsOfFriends = new Map<
        string,
        AppBskyActorDefs.ProfileViewBasic
      >()

      await Promise.all(
        friends.slice(0, 4).map(friend =>
          getSuggestedFollowsByActor(friend.did).then(foafsRes => {
            for (const user of foafsRes.suggestions) {
              friendsOfFriends.set(user.did, user)
            }
          }),
        ),
      )

      setSuggestions(Array.from(friendsOfFriends.values()))
    }

    try {
      getSuggestions()
    } catch (e) {
      logger.error(`SearchScreenSuggestedFollows: failed to get suggestions`, {
        message: e,
      })
    }
  }, [currentAccount, setSuggestions, getSuggestedFollowsByActor])

  return suggestions.length ? (
    <List
      data={suggestions}
      renderItem={({item}) => <ProfileCardWithFollowBtn profile={item} noBg />}
      keyExtractor={item => item.did}
      // @ts-ignore web only -prf
      desktopFixedHeight
      contentContainerStyle={{paddingBottom: 1200}}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
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

function SearchScreenPostResults({query}: {query: string}) {
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
  } = useSearchPostsQuery({query: augmentedQuery})

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

function SearchScreenUserResults({query}: {query: string}) {
  const {_} = useLingui()
  const {data: results, isFetched} = useActorSearch(query)

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

const SECTIONS_LOGGEDOUT = ['Users']
const SECTIONS_LOGGEDIN = ['Posts', 'Users']
export function SearchScreenInner({
  query,
  primarySearch,
}: {
  query?: string
  primarySearch?: boolean
}) {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
  const {hasSession} = useSession()
  const {isDesktop} = useWebMediaQueries()

  const onPageSelected = React.useCallback(
    (index: number) => {
      setMinimalShellMode(false)
      setDrawerSwipeDisabled(index > 0)
    },
    [setDrawerSwipeDisabled, setMinimalShellMode],
  )

  if (hasSession) {
    return query ? (
      <Pager
        onPageSelected={onPageSelected}
        renderTabBar={props => (
          <CenteredView
            sideBorders
            style={[pal.border, pal.view, styles.tabBarContainer]}>
            <TabBar items={SECTIONS_LOGGEDIN} {...props} />
          </CenteredView>
        )}
        initialPage={0}>
        <View>
          <SearchScreenPostResults query={query} />
        </View>
        <View>
          <SearchScreenUserResults query={query} />
        </View>
      </Pager>
    ) : (
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
    )
  }

  return query ? (
    <Pager
      onPageSelected={onPageSelected}
      renderTabBar={props => (
        <CenteredView
          sideBorders
          style={[pal.border, pal.view, styles.tabBarContainer]}>
          <TabBar items={SECTIONS_LOGGEDOUT} {...props} />
        </CenteredView>
      )}
      initialPage={0}>
      <View>
        <SearchScreenUserResults query={query} />
      </View>
    </Pager>
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
            {isDesktop && !primarySearch ? (
              <Trans>Find users with the search tool on the right</Trans>
            ) : (
              <Trans>Find users on Bluesky</Trans>
            )}
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
  const search = useActorAutocompleteFn()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {isTabletOrDesktop, isTabletOrMobile} = useWebMediaQueries()

  const searchDebounceTimeout = React.useRef<NodeJS.Timeout | undefined>(
    undefined,
  )
  const [isFetching, setIsFetching] = React.useState<boolean>(false)
  const [query, setQuery] = React.useState<string>(props.route?.params?.q || '')
  const [searchResults, setSearchResults] = React.useState<
    AppBskyActorDefs.ProfileViewBasic[]
  >([])
  const [inputIsFocused, setInputIsFocused] = React.useState(false)
  const [showAutocompleteResults, setShowAutocompleteResults] =
    React.useState(false)
  const [searchHistory, setSearchHistory] = React.useState<string[]>([])

  /**
   * The Search screen's `q` param
   */
  const queryParam = props.route?.params?.q

  /**
   * If `true`, this means we received new instructions from the router. This
   * is handled in a effect, and used to update the value of `query` locally
   * within this screen.
   */
  const routeParamsMismatch = queryParam && queryParam !== query

  React.useEffect(() => {
    if (queryParam && routeParamsMismatch) {
      // reset immediately and let local state take over
      navigation.setParams({q: ''})
      // update query for next search
      setQuery(queryParam)
    }
  }, [queryParam, routeParamsMismatch, navigation])

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

  const onPressCancelSearch = React.useCallback(() => {
    scrollToTopWeb()
    textInput.current?.blur()
    setQuery('')
    setShowAutocompleteResults(false)
    if (searchDebounceTimeout.current)
      clearTimeout(searchDebounceTimeout.current)
  }, [textInput])

  const onPressClearQuery = React.useCallback(() => {
    scrollToTopWeb()
    setQuery('')
    setShowAutocompleteResults(false)
  }, [setQuery])

  const onChangeText = React.useCallback(
    async (text: string) => {
      scrollToTopWeb()

      setQuery(text)

      if (text.length > 0) {
        setIsFetching(true)
        setShowAutocompleteResults(true)

        if (searchDebounceTimeout.current) {
          clearTimeout(searchDebounceTimeout.current)
        }

        searchDebounceTimeout.current = setTimeout(async () => {
          const results = await search({query: text, limit: 30})

          if (results) {
            setSearchResults(results)
            setIsFetching(false)
          }
        }, 300)
      } else {
        if (searchDebounceTimeout.current) {
          clearTimeout(searchDebounceTimeout.current)
        }
        setSearchResults([])
        setIsFetching(false)
        setShowAutocompleteResults(false)
      }
    },
    [setQuery, search, setSearchResults],
  )

  const updateSearchHistory = React.useCallback(
    async (newQuery: string) => {
      newQuery = newQuery.trim()
      if (newQuery && !searchHistory.includes(newQuery)) {
        let newHistory = [newQuery, ...searchHistory]

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

  const onSubmit = React.useCallback(() => {
    scrollToTopWeb()
    setShowAutocompleteResults(false)
    updateSearchHistory(query)
  }, [query, setShowAutocompleteResults, updateSearchHistory])

  const onSoftReset = React.useCallback(() => {
    scrollToTopWeb()
    onPressCancelSearch()
  }, [onPressCancelSearch])

  const queryMaybeHandle = React.useMemo(() => {
    const match = MATCH_HANDLE.exec(query)
    return match && match[1]
  }, [query])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      return listenSoftReset(onSoftReset)
    }, [onSoftReset, setMinimalShellMode]),
  )

  const handleHistoryItemClick = (item: React.SetStateAction<string>) => {
    setQuery(item)
    onSubmit()
  }

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
            selectTextOnFocus
            returnKeyType="search"
            value={query}
            style={[pal.text, styles.headerSearchInput]}
            keyboardAppearance={theme.colorScheme}
            onFocus={() => setInputIsFocused(true)}
            onBlur={() => {
              // HACK
              // give 100ms to not stop click handlers in the search history
              // -prf
              setTimeout(() => setInputIsFocused(false), 100)
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
          {query ? (
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

        {query || inputIsFocused ? (
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
        ) : undefined}
      </CenteredView>

      {showAutocompleteResults ? (
        <>
          {isFetching || !moderationOpts ? (
            <Loader />
          ) : (
            <ScrollView
              style={{height: '100%'}}
              // @ts-ignore web only -prf
              dataSet={{stableGutters: '1'}}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag">
              <SearchLinkCard
                label={_(msg`Search for "${query}"`)}
                onPress={isNative ? onSubmit : undefined}
                to={
                  isNative
                    ? undefined
                    : `/search?q=${encodeURIComponent(query)}`
                }
                style={{borderBottomWidth: 1}}
              />

              {queryMaybeHandle ? (
                <SearchLinkCard
                  label={_(msg`Go to @${queryMaybeHandle}`)}
                  to={`/profile/${queryMaybeHandle}`}
                />
              ) : null}

              {searchResults.map(item => (
                <SearchProfileCard
                  key={item.did}
                  profile={item}
                  moderation={moderateProfile(item, moderationOpts)}
                />
              ))}

              <View style={{height: 200}} />
            </ScrollView>
          )}
        </>
      ) : !query && inputIsFocused ? (
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
                  Recent Searches
                </Text>
                {searchHistory.map((historyItem, index) => (
                  <View key={index} style={styles.historyItemContainer}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleHistoryItemClick(historyItem)}
                      style={styles.historyItem}>
                      <Text style={pal.text}>{historyItem}</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleRemoveHistoryItem(historyItem)}>
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
      ) : routeParamsMismatch ? (
        <ActivityIndicator />
      ) : (
        <SearchScreenInner query={query} />
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
  historyItem: {
    paddingVertical: 8,
  },
  historyItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
})
