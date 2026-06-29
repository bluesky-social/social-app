import {memo} from 'react'
import {TouchableOpacity, View, type ViewStyle} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
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
}: {
  items: AutocompleteItem[]
  isFetching: boolean
  searchText: string
  onSubmit: () => void
  onResultPress: () => void
  onProfileClick: (profile: bsky.profile.AnyProfileView) => void
}): React.ReactNode => {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()

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
          {items.map((item, index) => {
            if (item.type !== 'profile') return null
            return (
              <SearchProfileCard
                key={item.key}
                profile={item.profile as AppBskyActorDefs.ProfileViewBasic}
                moderationOpts={moderationOpts}
                onPress={() => {
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

  const outerStyle = [
    a.flex_1,
    a.py_lg,
    a.px_md,
    t.atoms.border_contrast_low,
    style,
  ]
  const innerStyle = [a.text_md, t.atoms.text]

  const inner = (
    <View style={outerStyle}>
      <Text style={innerStyle}>{label}</Text>
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
        <View style={outerStyle}>
          <Text style={innerStyle}>{label}</Text>
        </View>
      </Link>
    )
  }

  return inner
}
