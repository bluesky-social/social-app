import {useEffect, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {useSift} from '@bsky.app/sift'
import {StackActions, useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {ClearSearchHistoryPrompt} from '#/screens/Search/components/SearchHistory'
import {SearchHistoryDropdown} from '#/screens/Search/components/SearchHistoryDropdown'
import {
  definedFilterParams,
  type SearchFilters,
} from '#/screens/Search/searchParams'
import {useSearchHistory} from '#/screens/Search/util/useSearchHistory'
import {atoms as a} from '#/alf'
import {
  Autocomplete as AutocompleteBase,
  type AutocompleteItem,
  useAutocomplete,
} from '#/components/Autocomplete'
import {SearchInput} from '#/components/forms/SearchInput'
import * as Prompt from '#/components/Prompt'
import type * as bsky from '#/types/bsky'

export function DesktopSearch() {
  const navigation = useNavigation<NavigationProp>()
  const [active, setActive] = useState(false)
  const [query, setQuery] = useState<string>('')
  const showResults = active && !!query.length
  const showHistory = active && !query.length
  const clearHistoryPromptControl = Prompt.usePromptControl()
  const {updateSearchHistory, updateProfileHistory, clearAllHistory} =
    useSearchHistory()

  const sift = useSift({
    offset: a.p_sm.padding,
    placement: 'bottom',
  })

  /*
   * The sidebar is positioned from the center of the window, so resizing the
   * window moves the input. Sift only re-measures when its list changes, so
   * re-measure here to keep an open dropdown attached to the input.
   */
  const {width: windowWidth, height: windowHeight} = useWindowDimensions()
  const {updatePosition} = sift
  useEffect(() => {
    if (active) void updatePosition()
  }, [active, windowWidth, windowHeight, updatePosition])

  const blurInput = () => {
    const input: {blur: () => void} | null = sift.elements.input
    input?.blur()
  }

  const onFocus = () => {
    setActive(true)
  }

  const onBlur = () => {
    setActive(false)
  }

  const onChangeText = (text: string) => {
    setQuery(text)
    if (!active) {
      setActive(true)
    }
  }

  const onClearText = () => {
    setQuery('')
    setActive(false)
  }

  const onSubmit = () => {
    if (!query.length) return
    updateSearchHistory(query)
    onClearText()
    blurInput()
    navigation.dispatch(StackActions.push('Search', {q: query}))
  }

  const onSelect = (item: AutocompleteItem) => {
    if (item.type === 'profile') {
      updateProfileHistory(item.profile)
      onClearText()
      blurInput()
      navigation.navigate('Profile', {name: item.profile.handle})
    } else if (item.type === 'search') {
      updateSearchHistory(item.value)
      onClearText()
      blurInput()
      navigation.navigate('Search', {q: item.value})
    }
  }

  const onSelectHistoryTerm = (q: string, filters: SearchFilters) => {
    setActive(false)
    blurInput()
    navigation.dispatch(
      StackActions.push('Search', {q, ...definedFilterParams(filters)}),
    )
  }

  const onSelectHistoryProfile = (profile: bsky.profile.AnyProfileView) => {
    setActive(false)
    blurInput()
    navigation.navigate('Profile', {name: profile.handle})
  }

  const onPressClearHistory = () => {
    /*
     * Blur before opening the prompt. The prompt returns focus to whatever was
     * focused when it opened, and refocusing the input would reopen the
     * dropdown.
     */
    setActive(false)
    blurInput()
    clearHistoryPromptControl.open()
  }

  return (
    <View
      collapsable={false}
      ref={sift.refs.setAnchor}
      /*
       * The sidebar narrows at smaller breakpoints. That change lands in a
       * later render than the resize itself, so re-measure when the anchor's
       * own size changes too.
       */
      onLayout={() => void updatePosition()}>
      <SearchInput
        hotkey
        value={query}
        onFocus={onFocus}
        onBlur={onBlur}
        onChangeText={onChangeText}
        onClearText={onClearText}
        onSubmitEditing={onSubmit}
        {...sift.targetProps}
      />
      {showResults && (
        <Inner
          query={query}
          sift={sift}
          onSelect={onSelect}
          onDismiss={() => setActive(false)}
        />
      )}
      {showHistory && (
        <SearchHistoryDropdown
          sift={sift}
          onSelectTerm={onSelectHistoryTerm}
          onSelectProfile={onSelectHistoryProfile}
          onPressClearAll={onPressClearHistory}
          onDismiss={() => setActive(false)}
        />
      )}
      <ClearSearchHistoryPrompt
        control={clearHistoryPromptControl}
        onConfirm={clearAllHistory}
      />
    </View>
  )
}

function Inner({
  query,
  sift,
  onSelect,
  onDismiss,
}: {
  query: string
  sift: ReturnType<typeof useSift>
  onSelect: (item: AutocompleteItem) => void
  onDismiss: () => void
}) {
  const {items} = useAutocomplete({
    type: 'profile',
    query,
    showSearchFallback: true,
  })

  return items && items.length ? (
    <AutocompleteBase
      sift={sift}
      data={items}
      onSelect={onSelect}
      onDismiss={onDismiss}
    />
  ) : null
}
