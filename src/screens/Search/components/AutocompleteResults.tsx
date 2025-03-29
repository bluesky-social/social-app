import {memo} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {type AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {SearchLinkCard, SearchProfileCard} from '#/view/shell/desktop/Search'
import {atoms as a, native} from '#/alf'
import * as Layout from '#/components/Layout'

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
  const moderationOpts = useModerationOpts()
  const {_} = useLingui()
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
              isNative
                ? undefined
                : `/search?q=${encodeURIComponent(searchText)}`
            }
            style={{borderBottomWidth: 1}}
          />
          {autocompleteData?.map(item => (
            <SearchProfileCard
              key={item.did}
              profile={item}
              moderation={moderateProfile(item, moderationOpts)}
              onPress={() => {
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
