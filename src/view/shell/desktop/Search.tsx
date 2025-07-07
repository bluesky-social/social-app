import {memo, useCallback, useDeferredValue, useState} from 'react'
import React from 'react'
import {
  ActivityIndicator,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {SearchProfileCard} from '#/screens/Search/components/SearchProfileCard'
import {atoms as a, useTheme} from '#/alf'
import {SearchInput} from '#/components/forms/SearchInput'
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
  const [isActive, setIsActive] = useState(false)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const {data: autocompleteData, isFetching} = useActorAutocompleteQuery(
    deferredQuery,
    true,
  )

  const moderationOpts = useModerationOpts()

  const onChangeText = useCallback((text: string) => {
    setQuery(text)
    setIsActive(text.length > 0)
  }, [])

  const onPressCancelSearch = useCallback(() => {
    setQuery('')
    setIsActive(false)
  }, [setQuery])

  const onSubmit = useCallback(() => {
    setIsActive(false)
    if (!deferredQuery.length) return
    navigation.dispatch(StackActions.push('Search', {q: deferredQuery}))
  }, [deferredQuery, navigation])

  const onSearchProfileCardPress = React.useCallback(() => {
    setQuery('')
    setIsActive(false)
  }, [])

  return (
    <View style={[a.w_full]}>
      <SearchInput
        value={query}
        onChangeText={onChangeText}
        onClearText={onPressCancelSearch}
        onSubmitEditing={onSubmit}
      />
      {deferredQuery !== '' && isActive && moderationOpts && (
        <View
          style={[
            t.atoms.bg,
            t.atoms.border_contrast_low,
            a.mt_sm,
            a.w_full,
            a.border,
            a.rounded_sm,
            a.overflow_hidden,
            a.absolute,
          ]}>
          <SearchLinkCard
            label={_(msg`Search for "${deferredQuery}"`)}
            to={{screen: 'Search', params: {q: deferredQuery}}}
            style={[
              ((autocompleteData?.length ?? 0) > 0 || isFetching) && a.border_b,
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
        </View>
      )}
    </View>
  )
}
