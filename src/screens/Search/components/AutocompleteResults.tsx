import {memo} from 'react'
import {
  ActivityIndicator,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {Link} from '#/view/com/util/Link'
import {Text} from '#/view/com/util/text/Text'
import {SearchProfileCard} from '#/screens/Search/components/SearchProfileCard'
import {atoms as a, native} from '#/alf'
import * as Layout from '#/components/Layout'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'

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
  const ax = useAnalytics()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  return (
    <>
      {(isAutocompleteFetching && !autocompleteData?.length) ||
      !moderationOpts ? (
        <Layout.Content>
          <View style={[a.py_xl]}>
            <ActivityIndicator />
          </View>
        </Layout.Content>
      ) : (
        <Layout.Content
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <SearchLinkCard
            label={_(msg`Search for "${searchText}"`)}
            onPress={native(onSubmit)}
            to={
              IS_NATIVE
                ? undefined
                : `/search?q=${encodeURIComponent(searchText)}`
            }
            style={a.border_b}
          />
          {autocompleteData?.map((item, index) => (
            <SearchProfileCard
              key={item.did}
              profile={item}
              moderationOpts={moderationOpts}
              onPress={() => {
                ax.metric('search:autocomplete:press', {
                  profileDid: item.did,
                  position: index,
                })
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
  const pal = usePalette('default')

  const inner = (
    <View
      style={[pal.border, {paddingVertical: 16, paddingHorizontal: 12}, style]}>
      <Text type="md" style={[pal.text]}>
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

  return (
    <Link href={to} asAnchor anchorNoUnderline>
      <View
        style={[
          pal.border,
          {paddingVertical: 16, paddingHorizontal: 12},
          style,
        ]}>
        <Text type="md" style={[pal.text]}>
          {label}
        </Text>
      </View>
    </Link>
  )
}
