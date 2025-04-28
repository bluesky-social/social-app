import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  type StyleProp,
  type TextInput,
  View,
  type ViewStyle,
} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {HITSLOP_20} from '#/lib/constants'
import {HITSLOP_10} from '#/lib/constants'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {MagnifyingGlassIcon} from '#/lib/icons'
import {type NavigationProp} from '#/lib/routes/types'
import {isWeb} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {
  unstableCacheProfileView,
  useProfilesQuery,
} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {
  makeSearchQuery,
  type Params,
  parseSearchQuery,
} from '#/screens/Search/utils'
import {atoms as a, tokens, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {SearchInput} from '#/components/forms/SearchInput'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {account, useStorage} from '#/storage'
import type * as bsky from '#/types/bsky'
import {AutocompleteResults} from './components/AutocompleteResults'
import {SearchHistory} from './components/SearchHistory'
import {SearchLanguageDropdown} from './components/SearchLanguageDropdown'
import {Explore} from './Explore'
import {SearchResults} from './SearchResults'

export function SearchScreenShell({
  queryParam,
  testID,
  fixedParams,
  navButton = 'menu',
  inputPlaceholder,
  isExplore,
}: {
  queryParam: string
  testID: string
  fixedParams?: Params
  navButton?: 'back' | 'menu'
  inputPlaceholder?: string
  isExplore?: boolean
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute()
  const textInput = useRef<TextInput>(null)
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  // Query terms
  const [searchText, setSearchText] = useState<string>(queryParam)
  const {data: autocompleteData, isFetching: isAutocompleteFetching} =
    useActorAutocompleteQuery(searchText, true)

  const [showAutocomplete, setShowAutocomplete] = useState(false)

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
      ].slice(0, 10)
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
    async (item: bsky.profile.AnyProfileView) => {
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
  const [headerHeight, setHeaderHeight] = useState(0)
  const headerRef = useRef(null)
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

  const onPressClearQuery = useCallback(() => {
    scrollToTopWeb()
    setSearchText('')
    textInput.current?.focus()
  }, [])

  const onChangeText = useCallback(async (text: string) => {
    scrollToTopWeb()
    setSearchText(text)
  }, [])

  const navigateToItem = useCallback(
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

  const onPressCancelSearch = useCallback(() => {
    scrollToTopWeb()
    textInput.current?.blur()
    setShowAutocomplete(false)
    if (isWeb) {
      // Empty params resets the URL to be /search rather than /search?q=

      const {q: _q, ...parameters} = (route.params ?? {}) as {
        [key: string]: string
      }
      // @ts-expect-error route is not typesafe
      navigation.replace(route.name, parameters)
    } else {
      setSearchText('')
      navigation.setParams({q: ''})
    }
  }, [setShowAutocomplete, setSearchText, navigation, route.params, route.name])

  const onSubmit = useCallback(() => {
    navigateToItem(searchText)
  }, [navigateToItem, searchText])

  const onAutocompleteResultPress = useCallback(() => {
    if (isWeb) {
      setShowAutocomplete(false)
    } else {
      textInput.current?.blur()
    }
  }, [])

  const handleHistoryItemClick = useCallback(
    (item: string) => {
      setSearchText(item)
      navigateToItem(item)
    },
    [navigateToItem],
  )

  const handleProfileClick = useCallback(
    (profile: bsky.profile.AnyProfileView) => {
      unstableCacheProfileView(queryClient, profile)
      // Slight delay to avoid updating during push nav animation.
      setTimeout(() => {
        updateProfileHistory(profile)
      }, 400)
    },
    [updateProfileHistory, queryClient],
  )

  const onSoftReset = useCallback(() => {
    if (isWeb) {
      // Empty params resets the URL to be /search rather than /search?q=

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
    useCallback(() => {
      setMinimalShellMode(false)
      return listenSoftReset(onSoftReset)
    }, [onSoftReset, setMinimalShellMode]),
  )

  const onSearchInputFocus = useCallback(() => {
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

  const focusSearchInput = useCallback(() => {
    textInput.current?.focus()
  }, [])

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
                    {isExplore ? <Trans>Explore</Trans> : <Trans>Search</Trans>}
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
          <View style={[a.px_lg, a.pt_sm, a.pb_sm, a.overflow_hidden]}>
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
          focusSearchInput={focusSearchInput}
        />
      </View>
    </Layout.Screen>
  )
}

let SearchScreenInner = ({
  query,
  queryWithParams,
  headerHeight,
  focusSearchInput,
}: {
  query: string
  queryWithParams: string
  headerHeight: number
  focusSearchInput: () => void
}): React.ReactNode => {
  const t = useTheme()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {hasSession} = useSession()
  const {gtTablet} = useBreakpoints()
  const [activeTab, setActiveTab] = useState(0)
  const {_} = useLingui()

  const onPageSelected = useCallback(
    (index: number) => {
      setMinimalShellMode(false)
      setActiveTab(index)
    },
    [setMinimalShellMode],
  )

  return queryWithParams ? (
    <SearchResults
      query={query}
      queryWithParams={queryWithParams}
      activeTab={activeTab}
      headerHeight={headerHeight}
      onPageSelected={onPageSelected}
    />
  ) : hasSession ? (
    <Explore focusSearchInput={focusSearchInput} headerHeight={headerHeight} />
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
SearchScreenInner = memo(SearchScreenInner)

function useQueryManager({
  initialQuery,
  fixedParams,
}: {
  initialQuery: string
  fixedParams?: Params
}) {
  const {query, params: initialParams} = useMemo(() => {
    return parseSearchQuery(initialQuery || '')
  }, [initialQuery])
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery)
  const [lang, setLang] = useState(initialParams.lang || '')

  if (initialQuery !== prevInitialQuery) {
    // handle new queryParam change (from manual search entry)
    setPrevInitialQuery(initialQuery)
    setLang(initialParams.lang || '')
  }

  const params = useMemo(
    () => ({
      // default stuff
      ...initialParams,
      // managed stuff
      lang,
      ...fixedParams,
    }),
    [lang, initialParams, fixedParams],
  )
  const handlers = useMemo(
    () => ({
      setLang,
    }),
    [setLang],
  )

  return useMemo(() => {
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

function scrollToTopWeb() {
  if (isWeb) {
    window.scrollTo(0, 0)
  }
}
