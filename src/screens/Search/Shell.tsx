import {
  memo,
  useCallback,
  useEffect,
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
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated'
import {setStringAsync} from 'expo-clipboard'
import {Trans, useLingui} from '@lingui/react/macro'
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {HITSLOP_10, HITSLOP_20} from '#/lib/constants'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {MagnifyingGlassIcon} from '#/lib/icons'
import {type NavigationProp, type SearchParams} from '#/lib/routes/types'
import {listenSoftReset} from '#/state/events'
import {unstableCacheProfileView} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {
  countActiveFilters,
  definedFilterParams,
  filtersToRouteParams,
  hasActiveFilters,
  parseHistoryEntry,
  readSearchFilters,
  type SearchFilters,
  withoutFilterParams,
} from '#/screens/Search/searchParams'
import {
  atoms as a,
  native,
  platform,
  tokens,
  useBreakpoints,
  useTheme,
  web,
} from '#/alf'
import {useAutocomplete} from '#/components/Autocomplete'
import {Button, ButtonIcon} from '#/components/Button'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowShareRight'
import * as Layout from '#/components/Layout'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE, IS_WEB} from '#/env'
import {useSearchHistory} from '#/features/searchHistory'
import type * as bsky from '#/types/bsky'
import {AdvancedSearchDialog} from './components/AdvancedSearchDialog'
import {AutocompleteResults} from './components/AutocompleteResults'
import {DetectedLanguagesAdmonition} from './components/DetectedLanguagesAdmonition'
import {SearchAutocompleteInput} from './components/SearchAutocompleteInput'
import {SearchHistory} from './components/SearchHistory'
import {Explore} from './Explore'
import {SearchResults} from './SearchResults'

/**
 * Derived from the route param so the two can't drift. NonNullable because the
 * tab param is optional on the route but the handlers below always work with a
 * concrete value.
 */
type TabParam = NonNullable<SearchParams['tab']>

// Map tab parameter to tab index
function getTabIndex(tabParam?: TabParam) {
  switch (tabParam) {
    case 'feed':
      return 3 // Feeds tab
    case 'user':
    case 'profile':
      return 2 // People tab
    case 'latest':
      return 1 // Latest tab
    default:
      return 0 // Top tab
  }
}

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
  fixedParams?: SearchFilters
  navButton?: 'back' | 'menu'
  inputPlaceholder?: string
  isExplore?: boolean
}) {
  const ax = useAnalytics()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute()
  const textInput = useRef<TextInput>(null)
  const {t: l} = useLingui()
  const queryClient = useQueryClient()

  // Get tab parameter from route params
  const tabParam = (route.params as {q?: string; tab?: TabParam})?.tab
  const [activeTab, setActiveTab] = useState(() => getTabIndex(tabParam))

  // Query terms
  const [searchText, setSearchText] = useState<string>(queryParam)
  const searchTextRef = useRef(searchText)
  const updateSearchText = useCallback((text: string) => {
    searchTextRef.current = text
    setSearchText(text)
  }, [])

  const {items: autocompleteItems, isFetching: isAutocompleteFetching} =
    useAutocomplete({
      type: 'profile',
      /*
       * On web the dropdown (SearchAutocompleteInput) owns its own autocomplete
       * query; only the native inline list consumes this one, so pass an empty
       * query on web to keep the hook a no-op instead of doing wasted work.
       */
      query: IS_NATIVE ? searchText : '',
    })

  const [showAutocomplete, setShowAutocomplete] = useState(false)

  const {
    termHistory,
    profiles: historyProfiles,
    updateSearchHistory,
    updateProfileHistory,
    deleteSearchHistoryItem,
    deleteProfileHistoryItem,
  } = useSearchHistory()

  const {query, filters, setFilters, hasFilters} = useQueryManager({
    initialQuery: queryParam,
    fixedParams,
  })
  const showFilters = Boolean((query || hasFilters) && !showAutocomplete)

  const onChangeLang = useCallback(
    (lang: string) => {
      setFilters({...filters, lang: lang || undefined})
    },
    [filters, setFilters],
  )

  // web only - measure header height for sticky positioning
  const [headerHeight, setHeaderHeight] = useState(0)
  const headerRef = useRef(null)
  useLayoutEffect(() => {
    if (IS_WEB) {
      if (!headerRef.current) return
      const measurement = (headerRef.current as Element).getBoundingClientRect()
      setHeaderHeight(measurement.height)
    }
  }, [])

  /*
   * On native, navigating to an already-mounted Search screen with a new `q`
   * (e.g. from a post hashtag/search link) updates the route param without
   * remounting, so re-sync the input. Web handles this via the focus effect
   * below, which fires on back/forward navigation.
   */
  useEffect(() => {
    if (IS_NATIVE) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      updateSearchText(queryParam)
    }
  }, [queryParam, updateSearchText])
  useFocusEffect(
    useNonReactiveCallback(() => {
      if (IS_WEB) {
        updateSearchText(queryParam)
      }
    }),
  )

  const onPressClearQuery = useCallback(() => {
    scrollToTopWeb()
    /*
     * Clearing the query also resets any advanced-search filters, then keeps
     * the input focused so the user can immediately type a new search.
     */
    if (IS_WEB) {
      /*
       * Replace the param set so q/tab/filters drop out of the URL instead of
       * serializing as the literal string "undefined". fixedParams live on the
       * route already and are preserved by withoutSearchParams.
       */
      const parameters = withoutSearchParams(
        route.params as Record<string, unknown>,
      )
      // @ts-expect-error route is not typesafe
      navigation.replace(route.name, parameters)
    } else {
      updateSearchText('')
      navigation.setParams({...filtersToRouteParams({}), q: ''})
    }
    textInput.current?.focus()
  }, [updateSearchText, navigation, route])

  const onChangeText = useCallback(
    (text: string) => {
      scrollToTopWeb()
      updateSearchText(text)
    },
    [updateSearchText],
  )

  const navigateToItem = useCallback(
    (item: string, itemFilters: SearchFilters = filters) => {
      scrollToTopWeb()
      setShowAutocomplete(false)
      updateSearchHistory(item, itemFilters)

      if (IS_WEB) {
        const nextParams = {
          ...withoutFilterParams(route.params as Record<string, unknown>),
          ...definedFilterParams(itemFilters),
          q: item,
        }
        // @ts-expect-error route is not typesafe
        navigation.push(route.name, nextParams)
      } else {
        textInput.current?.blur()
        navigation.setParams({...filtersToRouteParams(itemFilters), q: item})
      }
    },
    [updateSearchHistory, navigation, route, filters],
  )

  const onPressCancelSearch = useCallback(() => {
    scrollToTopWeb()
    textInput.current?.blur()
    setShowAutocomplete(false)
    if (IS_WEB) {
      /*
       * Empty params resets the URL to be /search rather than /search?q=
       * Also clear tab and advanced-search filter parameters.
       */
      const parameters = withoutSearchParams(
        route.params as Record<string, unknown>,
      )
      // @ts-expect-error route is not typesafe
      navigation.replace(route.name, parameters)
    } else {
      updateSearchText('')
      navigation.setParams({
        ...filtersToRouteParams({}),
        q: '',
        tab: undefined,
      })
    }
  }, [
    setShowAutocomplete,
    updateSearchText,
    navigation,
    route.params,
    route.name,
  ])

  const onSubmit = (source: 'typed' | 'autocomplete') => () => {
    ax.metric('search:query', {
      source,
      filterCount: countActiveFilters(filters),
    })
    navigateToItem(searchTextRef.current)
  }

  const onSubmitAdvanced = useCallback(
    (text: string, nextFilters: SearchFilters) => {
      scrollToTopWeb()
      setShowAutocomplete(false)
      updateSearchText(text)
      updateSearchHistory(text, nextFilters)
      ax.metric('search:query', {
        source: 'typed',
        filterCount: countActiveFilters(nextFilters),
      })
      if (IS_WEB) {
        /*
         * Build a fresh param set so removed filters drop out of the URL.
         * Only defined filters are included - undefined values would serialize
         * as the literal string "undefined".
         */
        const nextParams = {
          ...withoutFilterParams(route.params as Record<string, unknown>),
          ...definedFilterParams(nextFilters),
          q: text,
        }
        // @ts-expect-error route is not typesafe
        navigation.push(route.name, nextParams)
      } else {
        textInput.current?.blur()
        // setParams merges, so pass undefined for absent keys to clear them.
        navigation.setParams({...filtersToRouteParams(nextFilters), q: text})
      }
    },
    [ax, navigation, route, updateSearchText, updateSearchHistory],
  )

  const onAutocompleteResultPress = useCallback(() => {
    if (IS_WEB) {
      setShowAutocomplete(false)
    } else {
      textInput.current?.blur()
    }
  }, [])

  const handleHistoryItemClick = useCallback(
    (item: string) => {
      /*
       * History entries may carry advanced-search filters (JSON-encoded);
       * term-only entries are plain strings. Restore both the query and
       * filters.
       */
      const {q, filters: itemFilters} = parseHistoryEntry(item)
      updateSearchText(q)
      navigateToItem(q, itemFilters)
    },
    [navigateToItem, updateSearchText],
  )

  const handleProfileClick = useCallback(
    (profile: bsky.profile.AnyProfileView) => {
      updateSearchText('')
      unstableCacheProfileView(queryClient, profile)
      // Slight delay to avoid updating during push nav animation.
      setTimeout(() => {
        updateProfileHistory(profile)
      }, 400)
    },
    [updateProfileHistory, queryClient, updateSearchText],
  )

  /**
   * Web only. Selecting a profile from the anchored autocomplete dropdown.
   */
  const onSelectProfile = useCallback(
    (profile: bsky.profile.AnyProfileView, position: number) => {
      ax.metric('search:autocomplete:press', {
        profileDid: profile.did,
        position,
      })
      handleProfileClick(profile)
      navigation.navigate('Profile', {name: profile.handle})
    },
    [ax, handleProfileClick, navigation],
  )

  /**
   * Web only. Selecting the "Search for X" row from the anchored autocomplete
   * dropdown. This runs the typed query as-is (not a suggested profile), so it
   * is attributed to `typed` rather than `autocomplete`.
   */
  const onSelectSearch = useCallback(
    (value: string) => {
      ax.metric('search:query', {
        source: 'typed',
        filterCount: countActiveFilters(filters),
      })
      updateSearchText(value)
      navigateToItem(value)
    },
    [ax, filters, navigateToItem, updateSearchText],
  )

  const onSoftReset = useCallback(() => {
    if (IS_WEB) {
      /*
       * Empty params resets the URL to be /search rather than /search?q=
       * Also clear tab and advanced-search filter parameters.
       */
      const parameters = withoutSearchParams(
        route.params as Record<string, unknown>,
      )
      // @ts-expect-error route is not typesafe
      navigation.replace(route.name, parameters)
    } else {
      updateSearchText('')
      navigation.setParams({
        ...filtersToRouteParams({}),
        q: '',
        tab: undefined,
      })
      textInput.current?.focus()
    }
  }, [navigation, route.name, route.params, updateSearchText])

  useFocusEffect(
    useCallback(() => {
      return listenSoftReset(onSoftReset)
    }, [onSoftReset]),
  )

  const onSearchInputFocus = useCallback(() => {
    if (IS_WEB) {
      // Prevent a jump on iPad by ensuring that
      // the initial focused render has no result list.
      requestAnimationFrame(() => {
        setShowAutocomplete(true)
      })
    } else {
      setShowAutocomplete(true)
    }
  }, [setShowAutocomplete])

  const onSearchInputBlur = useCallback(() => {
    /*
     * Bind autocomplete visibility to focus state on native. On web this
     * doesn't work because of focus management, which would render the
     * autocomplete results uninteractable.
     */
    if (IS_NATIVE) {
      setShowAutocomplete(false)
    }
  }, [])

  const focusSearchInput = useCallback(
    (tab?: TabParam) => {
      textInput.current?.focus()

      // If a tab is specified, set the tab parameter
      if (tab) {
        if (IS_WEB) {
          navigation.setParams({...route.params, tab})
        } else {
          navigation.setParams({tab})
        }
      }
    },
    [navigation, route],
  )

  const onShareSearch = useCallback(() => {
    const url = new URL('https://bsky.app')
    url.pathname = '/search'
    if (query) url.searchParams.set('q', query)
    for (const [key, value] of Object.entries(definedFilterParams(filters))) {
      url.searchParams.set(key, value)
    }
    ax.metric('search:shareLink:press', {
      filterCount: countActiveFilters(filters),
    })
    setStringAsync(url.toString()).then(
      () => Toast.show(l`Copied link to clipboard`, {type: 'success'}),
      () => Toast.show(l`Failed to copy link`, {type: 'error'}),
    )
  }, [ax, query, filters, l])

  const showHeader = !gtMobile || navButton !== 'menu'

  return (
    <Layout.Screen testID={testID}>
      <View
        ref={headerRef}
        onLayout={evt => {
          if (IS_WEB) setHeaderHeight(evt.nativeEvent.layout.height)
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
                  <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                    <AdvancedSearchDialog
                      disabled={activeTab > 1}
                      q={searchText}
                      filters={filters}
                      onSubmit={onSubmitAdvanced}
                    />
                    <Button
                      accessibilityRole="button"
                      size="small"
                      color="secondary"
                      shape="round"
                      label={l`Share this search`}
                      onPress={onShareSearch}>
                      <ButtonIcon icon={ShareIcon} />
                    </Button>
                  </View>
                ) : (
                  <Layout.Header.Slot />
                )}
              </Layout.Header.Outer>
            </View>
          )}
          <View style={[a.px_lg, a.pt_sm, a.pb_sm, a.overflow_hidden]}>
            <View style={[a.gap_sm]}>
              {query && !showAutocomplete && (
                <DetectedLanguagesAdmonition
                  query={query}
                  filters={filters}
                  sort={activeTab === 1 ? 'latest' : 'top'}
                  enabled={activeTab === 0 || activeTab === 1}
                  onPressLanguage={onChangeLang}
                />
              )}

              <View style={[a.w_full, a.flex_row, a.align_stretch, a.gap_sm]}>
                <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                  {showAutocomplete && (
                    <Button
                      label={l`Cancel search`}
                      size="small"
                      variant="ghost"
                      color="secondary"
                      shape="round"
                      style={[a.px_sm]}
                      onPress={onPressCancelSearch}
                      hitSlop={HITSLOP_10}>
                      <ButtonIcon icon={ArrowLeftIcon} size="lg" />
                    </Button>
                  )}
                  <View style={[a.flex_1]}>
                    <SearchAutocompleteInput
                      testID="searchScreenInput"
                      ref={textInput}
                      value={searchText}
                      onFocus={onSearchInputFocus}
                      onBlur={onSearchInputBlur}
                      onChangeText={onChangeText}
                      onClearText={onPressClearQuery}
                      onSubmitEditing={onSubmit('typed')}
                      placeholder={inputPlaceholder ?? l`Search`}
                      hitSlop={{...HITSLOP_20, top: 0}}
                      hotkey={true}
                      fixedParams={Boolean(fixedParams)}
                      onSelectProfile={onSelectProfile}
                      onSelectSearch={onSelectSearch}
                    />
                  </View>
                </View>
                {showFilters && !showHeader ? (
                  <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                    <AdvancedSearchDialog
                      disabled={activeTab > 1}
                      q={searchText}
                      filters={filters}
                      onSubmit={onSubmitAdvanced}
                    />
                    <Button
                      accessibilityRole="button"
                      size="small"
                      color="secondary"
                      shape="round"
                      label={l`Share this search`}
                      onPress={onShareSearch}>
                      <ButtonIcon icon={ShareIcon} />
                    </Button>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </Layout.Center>
      </View>

      <View style={[a.flex_1, a.relative]}>
        <View style={[a.flex_1, web(showAutocomplete && a.hidden)]}>
          <SearchScreenInner
            key={filters.lang ?? ''}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            query={query}
            filters={filters}
            hasFilters={hasFilters}
            headerHeight={headerHeight}
            focusSearchInput={focusSearchInput}
          />
        </View>

        {showAutocomplete && !fixedParams && (
          <Animated.View
            entering={native(FadeInDown.easing(Easing.out(Easing.cubic)))}
            exiting={native(FadeOutDown.easing(Easing.out(Easing.cubic)))}
            style={platform({
              web: [a.flex_1],
              native: [t.atoms.bg, a.absolute, a.inset_0],
            })}
            accessibilityViewIsModal
            accessibilityRole="list">
            {searchText.length > 0 && IS_NATIVE ? (
              <AutocompleteResults
                items={autocompleteItems}
                isFetching={isAutocompleteFetching}
                searchText={searchText}
                onSubmit={onSubmit('autocomplete')}
                onResultPress={onAutocompleteResultPress}
                onProfileClick={handleProfileClick}
              />
            ) : (
              <SearchHistory
                searchHistory={termHistory}
                selectedProfiles={historyProfiles}
                onItemClick={handleHistoryItemClick}
                onProfileClick={handleProfileClick}
                onRemoveItemClick={deleteSearchHistoryItem}
                onRemoveProfileClick={deleteProfileHistoryItem}
              />
            )}
          </Animated.View>
        )}
      </View>
    </Layout.Screen>
  )
}

let SearchScreenInner = ({
  activeTab,
  setActiveTab,
  query,
  filters,
  hasFilters,
  headerHeight,
  focusSearchInput,
}: {
  activeTab: number
  setActiveTab: React.Dispatch<React.SetStateAction<number>>
  query: string
  filters: SearchFilters
  hasFilters: boolean
  headerHeight: number
  focusSearchInput: (tab?: TabParam) => void
}): React.ReactNode => {
  const t = useTheme()
  const {hasSession} = useSession()
  const {gtTablet} = useBreakpoints()

  const onPageSelected = (index: number) => {
    setActiveTab(index)
  }

  return query || hasFilters ? (
    <SearchResults
      query={query}
      filters={filters}
      hasFilters={hasFilters}
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
            <Text style={[a.text_2xl, a.font_bold]}>
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
  fixedParams?: SearchFilters
}) {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute()

  // Free text only - structured filters live in sibling route params now.
  const query = initialQuery

  const filters = useMemo(() => {
    const fromRoute = readSearchFilters(route.params as Record<string, unknown>)
    // fixedParams (e.g. ProfileSearch's author) always win and can't be cleared.
    return {...fromRoute, ...fixedParams}
  }, [route.params, fixedParams])

  const setFilters = useCallback(
    (next: SearchFilters) => {
      const merged = {...next, ...fixedParams}
      if (IS_WEB) {
        /*
         * Replace the param set so removed filters drop out of the URL instead
         * of serializing as the literal string "undefined".
         */
        const nextParams = {
          ...withoutFilterParams(route.params as Record<string, unknown>),
          ...definedFilterParams(merged),
        }
        // @ts-expect-error route is not typesafe
        navigation.replace(route.name, nextParams)
      } else {
        navigation.setParams(filtersToRouteParams(merged))
      }
    },
    [navigation, route, fixedParams],
  )

  return useMemo(
    () => ({
      query,
      filters,
      setFilters,
      hasFilters: hasActiveFilters(filters),
    }),
    [query, filters, setFilters],
  )
}

function scrollToTopWeb() {
  if (IS_WEB) {
    window.scrollTo(0, 0)
  }
}

function withoutSearchParams(
  routeParams: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const parameters = withoutFilterParams(routeParams)
  delete parameters.q
  delete parameters.tab
  return parameters
}
