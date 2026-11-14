import {useState} from 'react'
import {View} from 'react-native'
import {useSift} from '@bsky.app/sift'
import {StackActions, useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {atUriToHref} from '#/lib/strings/url-helpers'
import {atoms as a} from '#/alf'
import {
  Autocomplete as AutocompleteBase,
  type AutocompleteItem,
  useAutocomplete,
} from '#/components/Autocomplete'
import {SearchInput} from '#/components/forms/SearchInput'
import {router} from '#/routes'

export function DesktopSearch() {
  const navigation = useNavigation<NavigationProp>()
  const [active, setActive] = useState(false)
  const [query, setQuery] = useState<string>('')
  const showResults = active && !!query.length

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

  /**
   * AT-URIs aren't useful as search terms, so open the record they point to
   * instead. Returns `false` if the query isn't an AT-URI the app can open.
   */
  const openAtUri = (q: string) => {
    const href = atUriToHref(q.trim())
    if (!href) return false
    navigation.dispatch(StackActions.push(...router.matchPath(href)))
    return true
  }

  const onSubmit = () => {
    if (!query.length) return
    onClearText()
    sift.elements.input.blur()
    if (!openAtUri(query)) {
      navigation.dispatch(StackActions.push('Search', {q: query}))
    }
  }

  const onSelect = (item: AutocompleteItem) => {
    if (item.type === 'profile') {
      onClearText()
      sift.elements.input.blur()
      navigation.navigate('Profile', {name: item.profile.handle})
    } else if (item.type === 'search') {
      onClearText()
      sift.elements.input.blur()
      if (!openAtUri(item.value)) {
        navigation.navigate('Search', {q: item.value})
      }
    }
  }

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
