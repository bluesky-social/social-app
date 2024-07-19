import React from 'react'
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import {ScrollView as RNGHScrollView} from 'react-native-gesture-handler'
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
import {createHitslop} from '#/lib/constants'
import {HITSLOP_10} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {MagnifyingGlassIcon} from '#/lib/icons'
import {makeProfileLink} from '#/lib/routes/links'
import {NavigationProp} from '#/lib/routes/types'
import {augmentSearchQuery} from '#/lib/strings/helpers'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {useActorSearch} from '#/state/queries/actor-search'
import {usePopularFeedsSearch} from '#/state/queries/feed'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
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
import {Link} from '#/view/com/util/Link'
import {List} from '#/view/com/util/List'
import {Text} from '#/view/com/util/text/Text'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {Explore} from '#/view/screens/Search/Explore'
import {SearchLinkCard, SearchProfileCard} from '#/view/shell/desktop/Search'
import {atoms as a, useTheme as useThemeNew} from '#/alf'
import * as FeedCard from '#/components/FeedCard'
import {Menu_Stroke2_Corner0_Rounded as Menu} from '#/components/icons/Menu'

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

let SearchScreenPostResults = ({
  query,
  sort,
  active,
}: {
  query: string
  sort?: 'top' | 'latest'
  active: boolean
}): React.ReactNode => {
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
SearchScreenPostResults = React.memo(SearchScreenPostResults)

let SearchScreenUserResults = ({
  query,
  active,
}: {
  query: string
  active: boolean
}): React.ReactNode => {
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
SearchScreenUserResults = React.memo(SearchScreenUserResults)

let SearchScreenFeedsResults = ({
  query,
  active,
}: {
  query: string
  active: boolean
}): React.ReactNode => {
  const t = useThemeNew()
  const {_} = useLingui()

  const {data: results, isFetched} = usePopularFeedsSearch({
    query,
    enabled: active,
  })

  return isFetched && results ? (
    <>
      {results.length ? (
        <List
          data={results}
          renderItem={({item}) => (
            <View
              style={[
                a.border_b,
                t.atoms.border_contrast_low,
                a.px_lg,
                a.py_lg,
              ]}>
              <FeedCard.Default view={item} />
            </View>
          )}
          keyExtractor={item => item.uri}
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
SearchScreenFeedsResults = React.memo(SearchScreenFeedsResults)

let SearchScreenInner = ({query}: {query?: string}): React.ReactNode => {
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
      {
        title: _(msg`Feeds`),
        component: (
          <SearchScreenFeedsResults query={query} active={activeTab === 3} />
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
    <Explore />
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
SearchScreenInner = React.memo(SearchScreenInner)

export function SearchScreen(
  props: NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>,
) {
  const navigation = useNavigation<NavigationProp>()
  const textInput = React.useRef<TextInput>(null)
  const {_} = useLingui()
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const setDrawerOpen = useSetDrawerOpen()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {isTabletOrDesktop, isTabletOrMobile} = useWebMediaQueries()

  // Query terms
  const queryParam = props.route?.params?.q ?? ''
  const [searchText, setSearchText] = React.useState<string>(queryParam)
  const {data: autocompleteData, isFetching: isAutocompleteFetching} =
    useActorAutocompleteQuery(searchText, true)

  const [showAutocomplete, setShowAutocomplete] = React.useState(false)
  const [searchHistory, setSearchHistory] = React.useState<string[]>([])
  const [selectedProfiles, setSelectedProfiles] = React.useState<
    AppBskyActorDefs.ProfileViewBasic[]
  >([])

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
        const profiles = await AsyncStorage.getItem('selectedProfiles')
        if (profiles !== null) {
          setSelectedProfiles(JSON.parse(profiles))
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
    textInput.current?.blur()
    setShowAutocomplete(false)
    setSearchText(queryParam)
  }, [queryParam])

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

  const updateSelectedProfiles = React.useCallback(
    async (profile: AppBskyActorDefs.ProfileViewBasic) => {
      let newProfiles = [
        profile,
        ...selectedProfiles.filter(p => p.did !== profile.did),
      ]

      if (newProfiles.length > 5) {
        newProfiles = newProfiles.slice(0, 5)
      }

      setSelectedProfiles(newProfiles)
      try {
        await AsyncStorage.setItem(
          'selectedProfiles',
          JSON.stringify(newProfiles),
        )
      } catch (e: any) {
        logger.error('Failed to save selected profiles', {message: e})
      }
    },
    [selectedProfiles, setSelectedProfiles],
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

  const onAutocompleteResultPress = React.useCallback(() => {
    if (isWeb) {
      setShowAutocomplete(false)
    } else {
      textInput.current?.blur()
    }
  }, [])

  const handleHistoryItemClick = React.useCallback(
    (item: string) => {
      setSearchText(item)
      navigateToItem(item)
    },
    [navigateToItem],
  )

  const handleProfileClick = React.useCallback(
    (profile: AppBskyActorDefs.ProfileViewBasic) => {
      // Slight delay to avoid updating during push nav animation.
      setTimeout(() => {
        updateSelectedProfiles(profile)
      }, 400)
    },
    [updateSelectedProfiles],
  )

  const onSoftReset = React.useCallback(() => {
    if (isWeb) {
      // Empty params resets the URL to be /search rather than /search?q=
      navigation.replace('Search', {})
    } else {
      setSearchText('')
      navigation.setParams({q: ''})
    }
  }, [navigation])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      return listenSoftReset(onSoftReset)
    }, [onSoftReset, setMinimalShellMode]),
  )

  const handleRemoveHistoryItem = React.useCallback(
    (itemToRemove: string) => {
      const updatedHistory = searchHistory.filter(item => item !== itemToRemove)
      setSearchHistory(updatedHistory)
      AsyncStorage.setItem(
        'searchHistory',
        JSON.stringify(updatedHistory),
      ).catch(e => {
        logger.error('Failed to update search history', {message: e})
      })
    },
    [searchHistory],
  )

  const handleRemoveProfile = React.useCallback(
    (profileToRemove: AppBskyActorDefs.ProfileViewBasic) => {
      const updatedProfiles = selectedProfiles.filter(
        profile => profile.did !== profileToRemove.did,
      )
      setSelectedProfiles(updatedProfiles)
      AsyncStorage.setItem(
        'selectedProfiles',
        JSON.stringify(updatedProfiles),
      ).catch(e => {
        logger.error('Failed to update selected profiles', {message: e})
      })
    },
    [selectedProfiles],
  )

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
            <Menu size="lg" fill={pal.colors.textLight} />
          </Pressable>
        )}
        <SearchInputBox
          textInput={textInput}
          searchText={searchText}
          showAutocomplete={showAutocomplete}
          setShowAutocomplete={setShowAutocomplete}
          onChangeText={onChangeText}
          onSubmit={onSubmit}
          onPressClearQuery={onPressClearQuery}
        />
        {showAutocomplete && (
          <View style={[styles.headerCancelBtn]}>
            <Pressable
              onPress={onPressCancelSearch}
              accessibilityRole="button"
              hitSlop={HITSLOP_10}>
              <Text style={pal.text}>
                <Trans>Cancel</Trans>
              </Text>
            </Pressable>
          </View>
        )}
      </CenteredView>
      <View
        style={{
          display: showAutocomplete ? 'flex' : 'none',
          flex: 1,
        }}>
        {searchText.length > 0 ? (
          <AutocompleteResults
            isAutocompleteFetching={isAutocompleteFetching}
            autocompleteData={autocompleteData}
            searchText={searchText}
            onSubmit={onSubmit}
            onResultPress={onAutocompleteResultPress}
            onProfileClick={handleProfileClick}
          />
        ) : (
          <SearchHistory
            searchHistory={searchHistory}
            selectedProfiles={selectedProfiles}
            onItemClick={handleHistoryItemClick}
            onProfileClick={handleProfileClick}
            onRemoveItemClick={handleRemoveHistoryItem}
            onRemoveProfileClick={handleRemoveProfile}
          />
        )}
      </View>
      <View
        style={{
          display: showAutocomplete ? 'none' : 'flex',
          flex: 1,
        }}>
        <SearchScreenInner query={queryParam} />
      </View>
    </View>
  )
}

let SearchInputBox = ({
  textInput,
  searchText,
  showAutocomplete,
  setShowAutocomplete,
  onChangeText,
  onSubmit,
  onPressClearQuery,
}: {
  textInput: React.RefObject<TextInput>
  searchText: string
  showAutocomplete: boolean
  setShowAutocomplete: (show: boolean) => void
  onChangeText: (text: string) => void
  onSubmit: () => void
  onPressClearQuery: () => void
}): React.ReactNode => {
  const pal = usePalette('default')
  const {_} = useLingui()
  const theme = useTheme()
  return (
    <Pressable
      // This only exists only for extra hitslop so don't expose it to the a11y tree.
      accessible={false}
      focusable={false}
      // @ts-ignore web-only
      tabIndex={-1}
      style={[
        {backgroundColor: pal.colors.backgroundLight},
        styles.headerSearchContainer,
        // @ts-expect-error web only
        isWeb && {
          cursor: 'default',
        },
      ]}
      onPress={() => {
        textInput.current?.focus()
      }}>
      <MagnifyingGlassIcon
        style={[pal.icon, styles.headerSearchIcon]}
        size={21}
      />
      <TextInput
        testID="searchTextInput"
        ref={textInput}
        placeholder={_(msg`Search`)}
        placeholderTextColor={pal.colors.textLight}
        returnKeyType="search"
        value={searchText}
        style={[pal.text, styles.headerSearchInput]}
        keyboardAppearance={theme.colorScheme}
        selectTextOnFocus={isNative}
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
      {showAutocomplete && searchText.length > 0 && (
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
      )}
    </Pressable>
  )
}
SearchInputBox = React.memo(SearchInputBox)

let AutocompleteResults = ({
  isAutocompleteFetching,
  autocompleteData,
  searchText,
  onSubmit,
  onResultPress,
  onProfileClick,
}: {
  isAutocompleteFetching: boolean
  autocompleteData: AppBskyActorDefs.ProfileViewBasic[] | undefined
  searchText: string
  onSubmit: () => void
  onResultPress: () => void
  onProfileClick: (profile: AppBskyActorDefs.ProfileViewBasic) => void
}): React.ReactNode => {
  const moderationOpts = useModerationOpts()
  const {_} = useLingui()
  return (
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
          {autocompleteData?.map(item => (
            <SearchProfileCard
              key={item.did}
              profile={item}
              moderation={moderateProfile(item, moderationOpts)}
              onPress={() => {
                onProfileClick(item)
                onResultPress()
              }}
            />
          ))}
          <View style={{height: 200}} />
        </ScrollView>
      )}
    </>
  )
}
AutocompleteResults = React.memo(AutocompleteResults)

function truncateText(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...'
  }
  return text
}

function SearchHistory({
  searchHistory,
  selectedProfiles,
  onItemClick,
  onProfileClick,
  onRemoveItemClick,
  onRemoveProfileClick,
}: {
  searchHistory: string[]
  selectedProfiles: AppBskyActorDefs.ProfileViewBasic[]
  onItemClick: (item: string) => void
  onProfileClick: (profile: AppBskyActorDefs.ProfileViewBasic) => void
  onRemoveItemClick: (item: string) => void
  onRemoveProfileClick: (profile: AppBskyActorDefs.ProfileViewBasic) => void
}) {
  const {isTabletOrDesktop, isMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  const {_} = useLingui()

  return (
    <CenteredView
      sideBorders={isTabletOrDesktop}
      // @ts-ignore web only -prf
      style={{
        height: isWeb ? '100vh' : undefined,
      }}>
      <View style={styles.searchHistoryContainer}>
        {(searchHistory.length > 0 || selectedProfiles.length > 0) && (
          <Text style={[pal.text, styles.searchHistoryTitle]}>
            <Trans>Recent Searches</Trans>
          </Text>
        )}
        {selectedProfiles.length > 0 && (
          <View
            style={[
              styles.selectedProfilesContainer,
              isMobile && styles.selectedProfilesContainerMobile,
            ]}>
            <RNGHScrollView
              keyboardShouldPersistTaps="handled"
              horizontal={true}
              style={styles.profilesRow}
              contentContainerStyle={{
                borderWidth: 0,
              }}>
              {selectedProfiles.slice(0, 5).map((profile, index) => (
                <View
                  key={index}
                  style={[
                    styles.profileItem,
                    isMobile && styles.profileItemMobile,
                  ]}>
                  <Link
                    href={makeProfileLink(profile)}
                    title={profile.handle}
                    asAnchor
                    anchorNoUnderline
                    onBeforePress={() => onProfileClick(profile)}
                    style={styles.profilePressable}>
                    <Image
                      source={{uri: profile.avatar}}
                      style={styles.profileAvatar as StyleProp<ImageStyle>}
                      accessibilityIgnoresInvertColors
                    />
                    <Text style={[pal.text, styles.profileName]}>
                      {truncateText(profile.displayName || '', 12)}
                    </Text>
                  </Link>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={_(msg`Remove profile`)}
                    accessibilityHint={_(
                      msg`Remove profile from search history`,
                    )}
                    onPress={() => onRemoveProfileClick(profile)}
                    hitSlop={createHitslop(6)}
                    style={styles.profileRemoveBtn}>
                    <FontAwesomeIcon
                      icon="xmark"
                      size={14}
                      style={pal.textLight as FontAwesomeIconStyle}
                    />
                  </Pressable>
                </View>
              ))}
            </RNGHScrollView>
          </View>
        )}
        {searchHistory.length > 0 && (
          <View style={styles.searchHistoryContent}>
            {searchHistory.slice(0, 5).map((historyItem, index) => (
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
                  onPress={() => onItemClick(historyItem)}
                  hitSlop={HITSLOP_10}
                  style={[a.flex_1, a.py_sm]}>
                  <Text style={pal.text}>{historyItem}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onRemoveItemClick(historyItem)}
                  hitSlop={HITSLOP_10}
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
  )
}

function scrollToTopWeb() {
  if (isWeb) {
    window.scrollTo(0, 0)
  }
}

const HEADER_HEIGHT = 46

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingLeft: 13,
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
    alignSelf: 'center',
    zIndex: -1,
    elevation: -1, // For Android
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
  selectedProfilesContainer: {
    marginTop: 10,
    paddingHorizontal: 12,
    height: 80,
  },
  selectedProfilesContainerMobile: {
    height: 100,
  },
  profilesRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  profileItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 78,
  },
  profileItemMobile: {
    width: 70,
  },
  profilePressable: {
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 45,
  },
  profileName: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  profileRemoveBtn: {
    position: 'absolute',
    top: 0,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchHistoryContent: {
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  searchHistoryTitle: {
    fontWeight: 'bold',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
})
