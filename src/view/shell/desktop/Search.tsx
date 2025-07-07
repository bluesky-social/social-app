import {memo, useDeferredValue, useRef, useState} from 'react'
import {
  ActivityIndicator,
  type StyleProp,
  type TextInput,
  View,
  type ViewStyle,
} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'
import type React from 'react'

import {type NavigationProp} from '#/lib/routes/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {SearchProfileCard} from '#/screens/Search/components/SearchProfileCard'
import {atoms as a, useTheme} from '#/alf'
import {SearchInput} from '#/components/forms/SearchInput'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass2'
import {Link, type LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'

let SearchLinkCard = ({
  label,
  to,
  style,
}: {
  label: string
  to: LinkProps['to']
  style?: StyleProp<ViewStyle>
}): React.ReactNode => {
  const t = useTheme()

  return (
    <Link to={to} label={label}>
      {({focused, hovered, pressed}) => (
        <View
          style={[
            a.w_full,
            t.atoms.border_contrast_low,
            a.py_lg,
            a.px_md,
            (focused || hovered || pressed) && t.atoms.bg_contrast_25,
            style,
          ]}>
          <Text style={[a.text_sm, a.leading_snug]}>{label}</Text>
        </View>
      )}
    </Link>
  )
}
SearchLinkCard = memo(SearchLinkCard)
export {SearchLinkCard}

export function DesktopSearch() {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()

  const searchInputRef = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const {data: autocompleteData, isFetching} = useActorAutocompleteQuery(
    deferredQuery,
    true,
  )

  const moderationOpts = useModerationOpts()

  const onChangeText = (text: string) => {
    setQuery(text)
  }

  const onPressCancelSearch = () => {
    setQuery('')
  }

  const onEscape = () => {
    setQuery('')
    searchInputRef.current?.blur()
  }

  const onSubmit = () => {
    if (!deferredQuery.length) return
    navigation.dispatch(StackActions.push('Search', {q: deferredQuery}))
    setQuery('')
  }

  const onSearchProfileCardPress = () => {
    setQuery('')
  }

  return (
    <View style={[a.w_full, a.z_10]}>
      <SearchInput
        ref={searchInputRef}
        value={query}
        onChangeText={onChangeText}
        onClearText={onPressCancelSearch}
        onEscape={onEscape}
        onSubmitEditing={onSubmit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {(deferredQuery !== '' || isFocused) && moderationOpts && (
        <View style={[a.w_full]}>
          <View
            style={[
              t.atoms.bg,
              t.atoms.border_contrast_low,
              a.w_full,
              a.border,
              a.mt_sm,
              a.rounded_sm,
              a.overflow_hidden,
              a.absolute,
              a.shadow_lg,
              a.zoom_fade_in,
            ]}>
            {deferredQuery.length === 0 ? (
              <View style={[a.py_xl, a.gap_sm, a.align_center]}>
                <SearchIcon size="2xl" style={[t.atoms.text_contrast_low]} />
                <Text
                  style={[a.text_sm, t.atoms.text_contrast_low, a.text_center]}>
                  <Trans>Start typing to search</Trans>
                </Text>
              </View>
            ) : (
              <>
                <SearchLinkCard
                  label={_(msg`Search for "${deferredQuery}"`)}
                  to={{screen: 'Search', params: {q: deferredQuery}}}
                  style={[
                    ((autocompleteData?.length ?? 0) > 0 || isFetching) &&
                      a.border_b,
                  ]}
                />
                {isFetching && !autocompleteData?.length ? (
                  <View style={[a.p_md]}>
                    <ActivityIndicator />
                  </View>
                ) : (
                  autocompleteData?.map(item => (
                    <SearchProfileCard
                      key={item.did}
                      profile={item}
                      moderationOpts={moderationOpts}
                      onPress={onSearchProfileCardPress}
                    />
                  ))
                )}
              </>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
