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
import {useGate} from '#/lib/statsig/statsig'
import {augmentSearchQuery} from '#/lib/strings/helpers'
import {s} from '#/lib/styles'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {useActorAutocompleteFn} from '#/state/queries/actor-autocomplete'
import {useActorSearch} from '#/state/queries/actor-search'
import {useModerationOpts} from '#/state/queries/preferences'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {
  useGetSuggestedFollowersByActor,
  useSuggestedFollowsQuery,
} from '#/state/queries/suggested-follows'
import {useSession} from '#/state/session'
import {useSetDrawerOpen} from '#/state/shell'
import {useSetDrawerSwipeDisabled, useSetMinimalShellMode} from '#/state/shell'
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
import {useThrottledValue} from '#/components/hooks/useThrottledValue'

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

function useSuggestedFollowsV1(): [
  AppBskyActorDefs.ProfileViewBasic[],
  () => void,
] {
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
              if (user.associated?.labeler) continue
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

  return [suggestions, () => {}]
}

function useSuggestedFollowsV2(): [
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
  const gate = useGate()
  const useSuggestedFollows = gate('use_new_suggestions_endpoint')
    ? // Conditional hook call here is *only* OK because useGate()
      // result won't change until a remount.
      useSuggestedFollowsV2
    : useSuggestedFollowsV1
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
  queryTerm,
  sort,
  active,
}: {
  queryTerm: string
  sort?: 'top' | 'latest'
  active: boolean
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const [isPTR, setIsPTR] = React.useState(false)

  const augmentedQuery = React.useMemo(() => {
    return augmentSearchQuery(queryTerm || '', {did: currentAccount?.did})
  }, [queryTerm, currentAccount])

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
            <EmptyState message={_(msg`No results found for ${queryTerm}`)} />
          )}
        </>
      ) : (
        <Loader />
      )}
    </>
  )
}

function SearchScreenUserResults({
  queryTerm,
  active,
}: {
  queryTerm: string
  active: boolean
}) {
  const {_} = useLingui()

  const {data: results, isFetched} = useActorSearch({
    query: queryTerm,
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
        <EmptyState message={_(msg`No results found for ${queryTerm}`)} />
      )}
    </>
  ) : (
    <Loader />
  )
}

export function SearchScreenInner({queryTerm}: {queryTerm?: string}) {
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
    if (!queryTerm) return []
    return [
      {
        title: _(msg`Top`),
        component: (
          <SearchScreenPostResults
            queryTerm={queryTerm}
            sort="top"
            active={activeTab === 0}
          />
        ),
      },
      {
        title: _(msg`Latest`),
        component: (
          <SearchScreenPostResults
            queryTerm={queryTerm}
            sort="latest"
            active={activeTab === 1}
          />
        ),
      },
      {
        title: _(msg`People`),
        component: (
          <SearchScreenUserResults
            queryTerm={queryTerm}
            active={activeTab === 2}
          />
        ),
      },
    ]
  }, [_, queryTerm, activeTab])

  return queryTerm ? (
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
  const q = props.route?.params?.q ?? ''
  const [queryTerm, setQueryTerm] = React.useState<string>(q)
  const [searchText, setSearchText] = React.useState<string>(q)
  const throttledInput = useThrottledValue(searchText, 300)

  // Autocomplete
  const search = useActorAutocompleteFn()
  const [autocompleteData, setAutocompleteData] =
    React.useState<AppBskyActorDefs.ProfileViewBasic[]>()

  const [inputIsFocused, setInputIsFocused] = React.useState(false)
  const [showAutocompleteResults, setShowAutocompleteResults] =
    React.useState(false)
  const [searchHistory, setSearchHistory] = React.useState<string[]>([])

  if (q !== queryTerm) {
    setQueryTerm(q)
    setSearchText(q)
  }

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

  React.useEffect(() => {
    if (!throttledInput) {
      setAutocompleteData(undefined)
    } else {
      search({query: throttledInput}).then(res => {
        setAutocompleteData(res)
      })
    }
  }, [search, throttledInput])

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
    setShowAutocompleteResults(false)

    if (inputIsFocused) {
      setSearchText(queryTerm)
      // setInputIsFocused(false)
      textInput.current?.blur()
    } else {
      if (isWeb && queryTerm) {
        navigation.goBack()
      } else {
        navigation.setParams({q: ''})
      }
    }
  }, [inputIsFocused, navigation, queryTerm])

  const onChangeText = React.useCallback(async (text: string) => {
    scrollToTopWeb()
    setSearchText(text)
    setShowAutocompleteResults(text.length > 0)
  }, [])

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
    updateSearchHistory(searchText)
    setQueryTerm(searchText)

    if (isWeb) {
      navigation.push('Search', {q: searchText})
    } else {
      navigation.setParams({q: searchText})
    }
  }, [navigation, searchText, updateSearchHistory])

  const onSoftReset = React.useCallback(() => {
    scrollToTopWeb()
    onPressCancelSearch()
  }, [onPressCancelSearch])

  const queryMaybeHandle = React.useMemo(() => {
    const match = MATCH_HANDLE.exec(queryTerm)
    return match && match[1]
  }, [queryTerm])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      return listenSoftReset(onSoftReset)
    }, [onSoftReset, setMinimalShellMode]),
  )

  const handleHistoryItemClick = (item: React.SetStateAction<string>) => {
    setQueryTerm(item)
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
            selectTextOnFocus={isNative}
            returnKeyType="search"
            value={searchText}
            style={[pal.text, styles.headerSearchInput]}
            keyboardAppearance={theme.colorScheme}
            onFocus={() => setInputIsFocused(true)}
            onBlur={() => {
              // HACK
              // give 100ms to not stop click handlers in the search history
              // -prf
              setTimeout(
                () =>
                  setInputIsFocused(Boolean(textInput.current?.isFocused())),
                100,
              )
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
          {inputIsFocused ? (
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

        {(queryTerm || inputIsFocused) && (
          <View style={styles.headerCancelBtn}>
            <Pressable
              onPress={onPressCancelSearch}
              accessibilityRole="button"
              hitSlop={HITSLOP_10}>
              <Text style={[pal.text]}>
                {isWeb && !inputIsFocused && q ? (
                  <Trans>Back</Trans>
                ) : (
                  <Trans>Cancel</Trans>
                )}
              </Text>
            </Pressable>
          </View>
        )}
      </CenteredView>

      {showAutocompleteResults ? (
        <>
          {/* TODO avoid showing spinner if we have any previous results -hailey */}
          {(searchText && !autocompleteData) || !moderationOpts ? (
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
                />
              ))}

              <View style={{height: 200}} />
            </ScrollView>
          )}
        </>
      ) : !queryTerm && inputIsFocused ? (
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
        <SearchScreenInner queryTerm={queryTerm} />
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
