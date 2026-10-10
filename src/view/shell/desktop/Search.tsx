import {useRef, useState} from 'react'
import {type TextInput, View} from 'react-native'
import {useSift} from '@bsky.app/sift'
import {StackActions, useNavigation} from '@react-navigation/native'

import {mergeRefs} from '#/lib/merge-refs'
import {type NavigationProp} from '#/lib/routes/types'
import {
  completeActorSearchOperator,
  getActorAutocompleteState,
} from '#/screens/Search/actorAutocomplete'
import {atoms as a} from '#/alf'
import {
  Autocomplete as AutocompleteBase,
  type AutocompleteItem,
  useAutocomplete,
} from '#/components/Autocomplete'
import {SearchInput} from '#/components/forms/SearchInput'

export function DesktopSearch() {
  const navigation = useNavigation<NavigationProp>()
  const [active, setActive] = useState(false)
  const [query, setQuery] = useState<string>('')
  const operatorContext = getActorAutocompleteState(query).context
  const showResults = active && !!query.length
  const inputRef = useRef<TextInput>(null)

  const sift = useSift({
    offset: a.p_sm.padding,
    placement: 'bottom',
  })

  const onFocus = () => {
    if (query.length) setActive(true)
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
    onClearText()
    inputRef.current?.blur()
    navigation.dispatch(StackActions.push('Search', {q: query}))
  }

  const onSelect = (item: AutocompleteItem) => {
    if (item.type === 'profile') {
      if (operatorContext) {
        setQuery(
          completeActorSearchOperator(
            query,
            operatorContext,
            item.profile.handle,
          ),
        )
        setActive(false)
        inputRef.current?.focus()
        return
      }
      onClearText()
      inputRef.current?.blur()
      navigation.navigate('Profile', {name: item.profile.handle})
    } else if (item.type === 'search') {
      onClearText()
      inputRef.current?.blur()
      navigation.navigate('Search', {q: item.value})
    }
  }

  const {ref: siftInputRef, ...siftTargetProps} = sift.targetProps

  return (
    <View collapsable={false} ref={sift.refs.setAnchor}>
      <SearchInput
        hotkey
        value={query}
        onFocus={onFocus}
        onBlur={onBlur}
        onChangeText={onChangeText}
        onClearText={onClearText}
        onSubmitEditing={onSubmit}
        ref={mergeRefs([inputRef, siftInputRef])}
        {...siftTargetProps}
      />
      {showResults && (
        <Inner
          query={query}
          sift={sift}
          onSelect={onSelect}
          onDismiss={() => setActive(false)}
        />
      )}
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
  const autocompleteState = getActorAutocompleteState(query)
  const {items: autocompleteItems} = useAutocomplete({
    type: 'profile',
    query: autocompleteState.query,
    showSearchFallback: !autocompleteState.showFullSearchFallback,
  })
  const actorItems = autocompleteState.query ? autocompleteItems : []
  const items: AutocompleteItem[] = autocompleteState.showFullSearchFallback
    ? [{key: `search-${query}`, type: 'search', value: query}, ...actorItems]
    : actorItems

  return items && items.length ? (
    <AutocompleteBase
      sift={sift}
      data={items}
      onSelect={onSelect}
      onDismiss={onDismiss}
    />
  ) : null
}
