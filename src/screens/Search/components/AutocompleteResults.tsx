import {memo} from 'react'
import {TouchableOpacity, View, type ViewStyle} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {getActorAutocompleteState} from '#/screens/Search/actorAutocomplete'
import {SearchProfileCard} from '#/screens/Search/components/SearchProfileCard'
import {atoms as a, native, useTheme} from '#/alf'
import {type AutocompleteItem} from '#/components/Autocomplete'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import type * as bsky from '#/types/bsky'

let AutocompleteResults = ({
  items,
  isFetching,
  searchText,
  onSubmit,
  onResultPress,
  onProfileClick,
  onSelectSearchOperator,
}: {
  items: AutocompleteItem[]
  isFetching: boolean
  searchText: string
  onSubmit: () => void
  onResultPress: () => void
  onProfileClick: (profile: bsky.profile.AnyProfileView) => void
  onSelectSearchOperator: (
    profile: bsky.profile.AnyProfileView,
    position: number,
  ) => void
}): React.ReactNode => {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const operatorContext = getActorAutocompleteState(searchText).context
  const isIncompleteOperator = operatorContext?.query === ''

  return (
    <>
      {(isFetching && !items.length) || !moderationOpts ? (
        <Layout.Content>
          <View style={[a.py_xl, a.align_center]}>
            <Loader size="xl" />
          </View>
        </Layout.Content>
      ) : (
        <Layout.Content
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {!isIncompleteOperator && (
            <SearchLinkCard
              label={l`Search for “${searchText}”`}
              onPress={native(onSubmit)}
              to={
                IS_NATIVE
                  ? undefined
                  : `/search?q=${encodeURIComponent(searchText)}`
              }
              style={a.border_b}
            />
          )}
          {items.map((item, index) => {
            if (item.type !== 'profile') return null
            return (
              <SearchProfileCard
                key={item.key}
                profile={item.profile}
                moderationOpts={moderationOpts}
                accessibilityLabel={
                  operatorContext
                    ? l`Use ${item.profile.handle} as the search author`
                    : undefined
                }
                accessibilityHint={
                  operatorContext
                    ? l`Completes the from search filter`
                    : undefined
                }
                onPress={event => {
                  if (operatorContext) {
                    event.preventDefault()
                    onSelectSearchOperator(item.profile, index)
                    return false
                  }
                  ax.metric('search:autocomplete:press', {
                    profileDid: item.profile.did,
                    position: index,
                  })
                  onProfileClick(item.profile)
                  onResultPress()
                }}
              />
            )
          })}
          <View style={{height: 200}} />
        </Layout.Content>
      )}
    </>
  )
}
AutocompleteResults = memo(AutocompleteResults)
export {AutocompleteResults}

let SearchLinkCard = ({
  label,
  to,
  onPress,
  style,
}: {
  label: string
  to?: string
  onPress?: () => void
  style?: ViewStyle
}): React.ReactNode => {
  const t = useTheme()

  const inner = (
    <View
      style={[a.flex_1, a.py_lg, a.px_md, t.atoms.border_contrast_low, style]}>
      <Text emoji style={[a.text_md, t.atoms.text]}>
        {label}
      </Text>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel={label}
        accessibilityHint="">
        {inner}
      </TouchableOpacity>
    )
  }

  if (to) {
    return (
      <Link label={label} to={to}>
        {inner}
      </Link>
    )
  }

  return inner
}
