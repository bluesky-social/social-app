import React, {useCallback, useLayoutEffect, useMemo} from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native'
import {ScrollView as RNGHScrollView} from 'react-native-gesture-handler'
import {AppBskyActorDefs, AppBskyFeedDefs, moderateProfile} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {APP_LANGUAGES, LANGUAGES} from '#/lib/../locale/languages'
import {createHitslop, HITSLOP_20} from '#/lib/constants'
import {HITSLOP_10} from '#/lib/constants'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {MagnifyingGlassIcon} from '#/lib/icons'
import {makeProfileLink} from '#/lib/routes/links'
import {NavigationProp} from '#/lib/routes/types'
import {
  NativeStackScreenProps,
  SearchTabNavigatorParams,
} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {augmentSearchQuery} from '#/lib/strings/helpers'
import {languageName} from '#/locale/helpers'
import {isNative, isWeb} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {useLanguagePrefs} from '#/state/preferences/languages'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {useActorSearch} from '#/state/queries/actor-search'
import {usePopularFeedsSearch} from '#/state/queries/feed'
import {
  unstableCacheProfileView,
  useProfilesQuery,
} from '#/state/queries/profile'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {Post} from '#/view/com/post/Post'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {Link} from '#/view/com/util/Link'
import {List} from '#/view/com/util/List'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Explore} from '#/view/screens/Search/Explore'
import {SearchLinkCard, SearchProfileCard} from '#/view/shell/desktop/Search'
import {makeSearchQuery, Params, parseSearchQuery} from '#/screens/Search/utils'
import {
  atoms as a,
  native,
  platform,
  tokens,
  useBreakpoints,
  useTheme,
  web,
} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as FeedCard from '#/components/FeedCard'
import {SearchInput} from '#/components/forms/SearchInput'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon,
} from '#/components/icons/Chevron'
import {Earth_Stroke2_Corner0_Rounded as EarthIcon} from '#/components/icons/Globe'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as Layout from '#/components/Layout'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {account, useStorage} from '#/storage'
import * as bsky from '#/types/bsky'

function Loader() {
  return (
    <Layout.Content>
      <View style={[a.py_xl]}>
        <ActivityIndicator />
      </View>
    </Layout.Content>
  )
}

function EmptyState({message, error}: {message: string; error?: string}) {
  const t = useTheme()

  return (
    <Layout.Content>
      <View style={[a.p_xl]}>
        <View style={[t.atoms.bg_contrast_25, a.rounded_sm, a.p_lg]}>
          <Text style={[a.text_md]}>{message}</Text>

          {error && (
            <>
              <View
                style={[
                  {
                    marginVertical: 12,
                    height: 1,
                    width: '100%',
                    backgroundColor: t.atoms.text.color,
                    opacity: 0.2,
                  },
                ]}
              />

              <Text style={[t.atoms.text_contrast_medium]}>
                <Trans>Error:</Trans> {error}
              </Text>
            </>
          )}
        </View>
      </View>
    </Layout.Content>
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
                  return null
                }
              }}
              keyExtractor={item => item.key}
              refreshing={isPTR}
              onRefresh={onPullToRefresh}
              onEndReached={onEndReached}
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
    query,
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
  const t = useTheme()
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

function SearchLanguageDropdown({
  value,
  onChange,
}: {
  value: string
  onChange(value: string): void
}) {
  const {_} = useLingui()
  const {appLanguage, contentLanguages} = useLanguagePrefs()

  const languages = useMemo(() => {
    return LANGUAGES.filter(
      (lang, index, self) =>
        Boolean(lang.code2) && // reduce to the code2 varieties
        index === self.findIndex(t => t.code2 === lang.code2), // remove dupes (which will happen)
    )
      .map(l => ({
        label: languageName(l, appLanguage),
        value: l.code2,
        key: l.code2 + l.code3,
      }))
      .sort((a, b) => {
        // prioritize user's languages
        const aIsUser = contentLanguages.includes(a.value)
        const bIsUser = contentLanguages.includes(b.value)
        if (aIsUser && !bIsUser) return -1
        if (bIsUser && !aIsUser) return 1
        // prioritize "common" langs in the network
        const aIsCommon = !!APP_LANGUAGES.find(al => al.code2 === a.value)
        const bIsCommon = !!APP_LANGUAGES.find(al => al.code2 === b.value)
        if (aIsCommon && !bIsCommon) return -1
        if (bIsCommon && !aIsCommon) return 1
        // fall back to alphabetical
        return a.label.localeCompare(b.label)
      })
  }, [appLanguage, contentLanguages])

  const currentLanguageLabel =
    languages.find(lang => lang.value === value)?.label ?? _(msg`All languages`)

  return (
    <Menu.Root>
      <Menu.Trigger
        label={_(
          msg`Filter search by language (currently: ${currentLanguageLabel})`,
        )}>
        {({props}) => (
          <Button
            {...props}
            label={props.accessibilityLabel}
            size="small"
            color={platform({native: 'primary', default: 'secondary'})}
            variant={platform({native: 'ghost', default: 'solid'})}
            style={native([
              a.py_sm,
              a.px_sm,
              {marginRight: tokens.space.sm * -1},
            ])}>
            <ButtonIcon icon={EarthIcon} />
            <ButtonText>{currentLanguageLabel}</ButtonText>
            <ButtonIcon
              icon={platform({
                native: ChevronUpDownIcon,
                default: ChevronDownIcon,
              })}
            />
          </Button>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.LabelText>
          <Trans>Filter search by language</Trans>
        </Menu.LabelText>
        <Menu.Item label={_(msg`All languages`)} onPress={() => onChange('')}>
          <Menu.ItemText>
            <Trans>All languages</Trans>
          </Menu.ItemText>
          <Menu.ItemRadio selected={value === ''} />
        </Menu.Item>
        <Menu.Divider />
        <Menu.Group>
          {languages.map(lang => (
            <Menu.Item
              key={lang.key}
              label={lang.label}
              onPress={() => onChange(lang.value)}>
              <Menu.ItemText>{lang.label}</Menu.ItemText>
              <Menu.ItemRadio selected={value === lang.value} />
            </Menu.Item>
          ))}
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}

function useQueryManager({
  initialQuery,
  fixedParams,
}: {
  initialQuery: string
  fixedParams?: Params
}) {
  const {query, params: initialParams} = React.useMemo(() => {
    return parseSearchQuery(initialQuery || '')
  }, [initialQuery])
  const [prevInitialQuery, setPrevInitialQuery] = React.useState(initialQuery)
  const [lang, setLang] = React.useState(initialParams.lang || '')

  if (initialQuery !== prevInitialQuery) {
    // handle new queryParam change (from manual search entry)
    setPrevInitialQuery(initialQuery)
    setLang(initialParams.lang || '')
  }

  const params = React.useMemo(
    () => ({
      // default stuff
      ...initialParams,
      // managed stuff
      lang,
      ...fixedParams,
    }),
    [lang, initialParams, fixedParams],
  )
  const handlers = React.useMemo(
    () => ({
      setLang,
    }),
    [setLang],
  )

  return React.useMemo(() => {
    return {
      query,
      queryWithParams: makeSearchQuery(query, params),
      params: {
        ...params,
        ...handlers,
      },
    }
  }, [query, params, handlers])
}

let SearchScreenInner = ({
  query,
  queryWithParams,
  headerHeight,
}: {
  query: string
  queryWithParams: string
  headerHeight: number
}): React.ReactNode => {
  const t = useTheme()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {hasSession} = useSession()
  const {gtTablet} = useBreakpoints()
  const [activeTab, setActiveTab] = React.useState(0)
  const {_} = useLingui()

  const onPageSelected = React.useCallback(
    (index: number) => {
      setMinimalShellMode(false)
      setActiveTab(index)
    },
    [setMinimalShellMode],
  )

  const sections = React.useMemo(() => {
    if (!queryWithParams) return []
    const noParams = queryWithParams === query
    return [
      {
        title: _(msg`Top`),
        component: (
          <SearchScreenPostResults
            query={queryWithParams}
            sort="top"
            active={activeTab === 0}
          />
        ),
      },
      {
        title: _(msg`Latest`),
        component: (
          <SearchScreenPostResults
            query={queryWithParams}
            sort="latest"
            active={activeTab === 1}
          />
        ),
      },
      noParams && {
        title: _(msg`People`),
        component: (
          <SearchScreenUserResults query={query} active={activeTab === 2} />
        ),
      },
      noParams && {
        title: _(msg`Feeds`),
        component: (
          <SearchScreenFeedsResults query={query} active={activeTab === 3} />
        ),
      },
    ].filter(Boolean) as {
      title: string
      component: React.ReactNode
    }[]
  }, [_, query, queryWithParams, activeTab])

  return queryWithParams ? (
    <Pager
      onPageSelected={onPageSelected}
      renderTabBar={props => (
        <Layout.Center style={[a.z_10, web([a.sticky, {top: headerHeight}])]}>
          <TabBar items={sections.map(section => section.title)} {...props} />
        </Layout.Center>
      )}
      initialPage={0}>
      {sections.map((section, i) => (
        <View key={i}>{section.component}</View>
      ))}
    </Pager>
  ) : hasSession ? (
    <Explore />
  ) : (
    <Layout.Center>
      <View style={a.flex_1}>
        {gtTablet && (
          <View
            style={[
              a.border_b,
              t.atoms.border_contrast_low,
              a.px_lg,
              a.pt_sm,
              a.pb_lg,
            ]}>
            <Text style={[a.text_2xl, a.font_heavy]}>
              <Trans>Search</Trans>
            </Text>
          </View>
        )}

        <View style={[a.align_center, a.justify_center, a.py_4xl, a.gap_lg]}>
          <MagnifyingGlassIcon
            strokeWidth={3}
            size={60}
            style={t.atoms.text_contrast_medium as StyleProp<ViewStyle>}
          />
          <Text style={[t.atoms.text_contrast_medium, a.text_md]}>
            <Trans>Find posts, users, and feeds on Bluesky</Trans>
          </Text>
        </View>
      </View>
    </Layout.Center>
  )
}
SearchScreenInner = React.memo(SearchScreenInner)

export function SearchScreen(
  props: NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>,
) {
  const queryParam = props.route?.params?.q ?? ''

  return <SearchScreenShell queryParam={queryParam} testID="searchScreen" />
}

export function SearchScreenShell({
  queryParam,
  testID,
  fixedParams,
  navButton = 'menu',
  inputPlaceholder,
}: {
  queryParam: string
  testID: string
  fixedParams?: Params
  navButton?: 'back' | 'menu'
  inputPlaceholder?: string
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute()
  const textInput = React.useRef<TextInput>(null)
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  // Query terms
  const [searchText, setSearchText] = React.useState<string>(queryParam)
  const {data: autocompleteData, isFetching: isAutocompleteFetching} =
    useActorAutocompleteQuery(searchText, true)

  const [showAutocomplete, setShowAutocomplete] = React.useState(false)

  const [termHistory = [], setTermHistory] = useStorage(account, [
    currentAccount?.did ?? 'pwi',
    'searchTermHistory',
  ] as const)
  const [accountHistory = [], setAccountHistory] = useStorage(account, [
    currentAccount?.did ?? 'pwi',
    'searchAccountHistory',
  ])

  const {data: accountHistoryProfiles} = useProfilesQuery({
    handles: accountHistory,
    maintainData: true,
  })

  const updateSearchHistory = useCallback(
    async (item: string) => {
      if (!item) return
      const newSearchHistory = [
        item,
        ...termHistory.filter(search => search !== item),
      ].slice(0, 6)
      setTermHistory(newSearchHistory)
    },
    [termHistory, setTermHistory],
  )

  const updateProfileHistory = useCallback(
    async (item: bsky.profile.AnyProfileView) => {
      const newAccountHistory = [
        item.did,
        ...accountHistory.filter(p => p !== item.did),
      ].slice(0, 5)
      setAccountHistory(newAccountHistory)
    },
    [accountHistory, setAccountHistory],
  )

  const deleteSearchHistoryItem = useCallback(
    async (item: string) => {
      setTermHistory(termHistory.filter(search => search !== item))
    },
    [termHistory, setTermHistory],
  )
  const deleteProfileHistoryItem = useCallback(
    async (item: AppBskyActorDefs.ProfileViewDetailed) => {
      setAccountHistory(accountHistory.filter(p => p !== item.did))
    },
    [accountHistory, setAccountHistory],
  )

  const {params, query, queryWithParams} = useQueryManager({
    initialQuery: queryParam,
    fixedParams,
  })
  const showFilters = Boolean(queryWithParams && !showAutocomplete)

  // web only - measure header height for sticky positioning
  const [headerHeight, setHeaderHeight] = React.useState(0)
  const headerRef = React.useRef(null)
  useLayoutEffect(() => {
    if (isWeb) {
      if (!headerRef.current) return
      const measurement = (headerRef.current as Element).getBoundingClientRect()
      setHeaderHeight(measurement.height)
    }
  }, [])

  useFocusEffect(
    useNonReactiveCallback(() => {
      if (isWeb) {
        setSearchText(queryParam)
      }
    }),
  )

  const onPressClearQuery = React.useCallback(() => {
    scrollToTopWeb()
    setSearchText('')
    textInput.current?.focus()
  }, [])

  const onChangeText = React.useCallback(async (text: string) => {
    scrollToTopWeb()
    setSearchText(text)
  }, [])

  const navigateToItem = React.useCallback(
    (item: string) => {
      scrollToTopWeb()
      setShowAutocomplete(false)
      updateSearchHistory(item)

      if (isWeb) {
        // @ts-expect-error route is not typesafe
        navigation.push(route.name, {...route.params, q: item})
      } else {
        textInput.current?.blur()
        navigation.setParams({q: item})
      }
    },
    [updateSearchHistory, navigation, route],
  )

  const onPressCancelSearch = React.useCallback(() => {
    scrollToTopWeb()
    textInput.current?.blur()
    setShowAutocomplete(false)
    if (isWeb) {
      // Empty params resets the URL to be /search rather than /search?q=
      navigation.replace('Search', {})
    } else {
      setSearchText('')
      navigation.setParams({q: ''})
    }
  }, [setShowAutocomplete, setSearchText, navigation])

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
    (profile: bsky.profile.AnyProfileView) => {
      unstableCacheProfileView(queryClient, profile)
      // Slight delay to avoid updating during push nav animation.
      setTimeout(() => {
        updateProfileHistory(profile)
      }, 400)
    },
    [updateProfileHistory, queryClient],
  )

  const onSoftReset = React.useCallback(() => {
    if (isWeb) {
      // Empty params resets the URL to be /search rather than /search?q=
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {q: _q, ...parameters} = (route.params ?? {}) as {
        [key: string]: string
      }
      // @ts-expect-error route is not typesafe
      navigation.replace(route.name, parameters)
    } else {
      setSearchText('')
      navigation.setParams({q: ''})
      textInput.current?.focus()
    }
  }, [navigation, route])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      return listenSoftReset(onSoftReset)
    }, [onSoftReset, setMinimalShellMode]),
  )

  const onSearchInputFocus = React.useCallback(() => {
    if (isWeb) {
      // Prevent a jump on iPad by ensuring that
      // the initial focused render has no result list.
      requestAnimationFrame(() => {
        setShowAutocomplete(true)
      })
    } else {
      setShowAutocomplete(true)
    }
  }, [setShowAutocomplete])

  const showHeader = !gtMobile || navButton !== 'menu'

  return (
    <Layout.Screen testID={testID}>
      <View
        ref={headerRef}
        onLayout={evt => {
          if (isWeb) setHeaderHeight(evt.nativeEvent.layout.height)
        }}
        style={[
          a.relative,
          a.z_10,
          web({
            position: 'sticky',
            top: 0,
          }),
        ]}>
        <Layout.Center style={t.atoms.bg}>
          {showHeader && (
            <View
              // HACK: shift up search input. we can't remove the top padding
              // on the search input because it messes up the layout animation
              // if we add it only when the header is hidden
              style={{marginBottom: tokens.space.xs * -1}}>
              <Layout.Header.Outer noBottomBorder>
                {navButton === 'menu' ? (
                  <Layout.Header.MenuButton />
                ) : (
                  <Layout.Header.BackButton />
                )}
                <Layout.Header.Content align="left">
                  <Layout.Header.TitleText>
                    <Trans>Search</Trans>
                  </Layout.Header.TitleText>
                </Layout.Header.Content>
                {showFilters ? (
                  <SearchLanguageDropdown
                    value={params.lang}
                    onChange={params.setLang}
                  />
                ) : (
                  <Layout.Header.Slot />
                )}
              </Layout.Header.Outer>
            </View>
          )}
          <View style={[a.px_md, a.pt_sm, a.pb_sm, a.overflow_hidden]}>
            <View style={[a.gap_sm]}>
              <View style={[a.w_full, a.flex_row, a.align_stretch, a.gap_xs]}>
                <View style={[a.flex_1]}>
                  <SearchInput
                    ref={textInput}
                    value={searchText}
                    onFocus={onSearchInputFocus}
                    onChangeText={onChangeText}
                    onClearText={onPressClearQuery}
                    onSubmitEditing={onSubmit}
                    placeholder={
                      inputPlaceholder ??
                      _(msg`Search for posts, users, or feeds`)
                    }
                    hitSlop={{...HITSLOP_20, top: 0}}
                  />
                </View>
                {showAutocomplete && (
                  <Button
                    label={_(msg`Cancel search`)}
                    size="large"
                    variant="ghost"
                    color="secondary"
                    style={[a.px_sm]}
                    onPress={onPressCancelSearch}
                    hitSlop={HITSLOP_10}>
                    <ButtonText>
                      <Trans>Cancel</Trans>
                    </ButtonText>
                  </Button>
                )}
              </View>

              {showFilters && !showHeader && (
                <View
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.justify_between,
                    a.gap_sm,
                  ]}>
                  <SearchLanguageDropdown
                    value={params.lang}
                    onChange={params.setLang}
                  />
                </View>
              )}
            </View>
          </View>
        </Layout.Center>
      </View>

      <View
        style={{
          display: showAutocomplete && !fixedParams ? 'flex' : 'none',
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
            searchHistory={termHistory}
            selectedProfiles={accountHistoryProfiles?.profiles || []}
            onItemClick={handleHistoryItemClick}
            onProfileClick={handleProfileClick}
            onRemoveItemClick={deleteSearchHistoryItem}
            onRemoveProfileClick={deleteProfileHistoryItem}
          />
        )}
      </View>
      <View
        style={{
          display: showAutocomplete ? 'none' : 'flex',
          flex: 1,
        }}>
        <SearchScreenInner
          query={query}
          queryWithParams={queryWithParams}
          headerHeight={headerHeight}
        />
      </View>
    </Layout.Screen>
  )
}

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
        <Layout.Content
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
        </Layout.Content>
      )}
    </>
  )
}
AutocompleteResults = React.memo(AutocompleteResults)

function SearchHistory({
  searchHistory,
  selectedProfiles,
  onItemClick,
  onProfileClick,
  onRemoveItemClick,
  onRemoveProfileClick,
}: {
  searchHistory: string[]
  selectedProfiles: AppBskyActorDefs.ProfileViewDetailed[]
  onItemClick: (item: string) => void
  onProfileClick: (profile: AppBskyActorDefs.ProfileViewDetailed) => void
  onRemoveItemClick: (item: string) => void
  onRemoveProfileClick: (profile: AppBskyActorDefs.ProfileViewDetailed) => void
}) {
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Layout.Content
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled">
      <View style={[a.w_full, a.px_md]}>
        {(searchHistory.length > 0 || selectedProfiles.length > 0) && (
          <Text style={[a.text_md, a.font_bold, a.p_md]}>
            <Trans>Recent Searches</Trans>
          </Text>
        )}
        {selectedProfiles.length > 0 && (
          <View
            style={[
              styles.selectedProfilesContainer,
              !gtMobile && styles.selectedProfilesContainerMobile,
            ]}>
            <RNGHScrollView
              keyboardShouldPersistTaps="handled"
              horizontal={true}
              style={[
                a.flex_row,
                a.flex_nowrap,
                {marginHorizontal: tokens.space._2xl * -1},
              ]}
              contentContainerStyle={[a.px_2xl, a.border_0]}>
              {selectedProfiles.slice(0, 5).map((profile, index) => (
                <View
                  key={index}
                  style={[
                    styles.profileItem,
                    !gtMobile && styles.profileItemMobile,
                  ]}>
                  <Link
                    href={makeProfileLink(profile)}
                    title={profile.handle}
                    asAnchor
                    anchorNoUnderline
                    onBeforePress={() => onProfileClick(profile)}
                    style={[a.align_center, a.w_full]}>
                    <UserAvatar
                      avatar={profile.avatar}
                      type={profile.associated?.labeler ? 'labeler' : 'user'}
                      size={60}
                    />
                    <Text
                      emoji
                      style={[a.text_xs, a.text_center, styles.profileName]}
                      numberOfLines={1}>
                      {sanitizeDisplayName(
                        profile.displayName || profile.handle,
                      )}
                    </Text>
                  </Link>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={_(msg`Remove profile`)}
                    accessibilityHint={_(
                      msg`Removes profile from search history`,
                    )}
                    onPress={() => onRemoveProfileClick(profile)}
                    hitSlop={createHitslop(6)}
                    style={styles.profileRemoveBtn}>
                    <XIcon size="xs" style={t.atoms.text_contrast_low} />
                  </Pressable>
                </View>
              ))}
            </RNGHScrollView>
          </View>
        )}
        {searchHistory.length > 0 && (
          <View style={[a.pl_md, a.pr_xs, a.mt_md]}>
            {searchHistory.slice(0, 5).map((historyItem, index) => (
              <View key={index} style={[a.flex_row, a.align_center, a.mt_xs]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onItemClick(historyItem)}
                  hitSlop={HITSLOP_10}
                  style={[a.flex_1, a.py_md]}>
                  <Text style={[a.text_md]}>{historyItem}</Text>
                </Pressable>
                <Button
                  label={_(msg`Remove ${historyItem}`)}
                  onPress={() => onRemoveItemClick(historyItem)}
                  size="small"
                  variant="ghost"
                  color="secondary"
                  shape="round">
                  <ButtonIcon icon={XIcon} />
                </Button>
              </View>
            ))}
          </View>
        )}
      </View>
    </Layout.Content>
  )
}

function scrollToTopWeb() {
  if (isWeb) {
    window.scrollTo(0, 0)
  }
}

const styles = StyleSheet.create({
  selectedProfilesContainer: {
    marginTop: 10,
    paddingHorizontal: 12,
    height: 80,
  },
  selectedProfilesContainerMobile: {
    height: 100,
  },
  profileItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 78,
  },
  profileItemMobile: {
    width: 70,
  },
  profileName: {
    width: 78,
    marginTop: 6,
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
})
