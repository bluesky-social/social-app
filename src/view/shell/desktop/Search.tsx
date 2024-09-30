import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {
  AppBskyActorDefs,
  moderateProfile,
  ModerationDecision,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {NavigationProp} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {s} from '#/lib/styles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {precacheProfile} from '#/state/queries/profile'
import {Link} from '#/view/com/util/Link'
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a} from '#/alf'
import {SearchInput} from '#/components/forms/SearchInput'

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
SearchLinkCard = React.memo(SearchLinkCard)
export {SearchLinkCard}

let SearchProfileCard = ({
  profile,
  moderation,
  onPress: onPressInner,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  moderation: ModerationDecision
  onPress: () => void
}): React.ReactNode => {
  const pal = usePalette('default')
  const queryClient = useQueryClient()

  const onPress = React.useCallback(() => {
    precacheProfile(queryClient, profile)
    onPressInner()
  }, [queryClient, profile, onPressInner])

  return (
    <Link
      testID={`searchAutoCompleteResult-${profile.handle}`}
      href={makeProfileLink(profile)}
      title={profile.handle}
      asAnchor
      anchorNoUnderline
      onBeforePress={onPress}>
      <View
        style={[
          pal.border,
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
          },
        ]}>
        <UserAvatar
          size={40}
          avatar={profile.avatar}
          moderation={moderation.ui('avatar')}
          type={profile.associated?.labeler ? 'labeler' : 'user'}
        />
        <View style={{flex: 1}}>
          <Text
            emoji
            type="lg"
            style={[s.bold, pal.text, a.self_start]}
            numberOfLines={1}
            lineHeight={1.2}>
            {sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
              moderation.ui('displayName'),
            )}
          </Text>
          <Text type="md" style={[pal.textLight]} numberOfLines={1}>
            {sanitizeHandle(profile.handle, '@')}
          </Text>
        </View>
      </View>
    </Link>
  )
}
SearchProfileCard = React.memo(SearchProfileCard)
export {SearchProfileCard}

export function DesktopSearch() {
  const {_} = useLingui()
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()
  const [isActive, setIsActive] = React.useState<boolean>(false)
  const [query, setQuery] = React.useState<string>('')
  const {data: autocompleteData, isFetching} = useActorAutocompleteQuery(
    query,
    true,
  )

  const moderationOpts = useModerationOpts()

  const onChangeText = React.useCallback((text: string) => {
    setQuery(text)
    setIsActive(text.length > 0)
  }, [])

  const onPressCancelSearch = React.useCallback(() => {
    setQuery('')
    setIsActive(false)
  }, [setQuery])

  const onSubmit = React.useCallback(() => {
    setIsActive(false)
    if (!query.length) return
    navigation.dispatch(StackActions.push('Search', {q: query}))
  }, [query, navigation])

  const onSearchProfileCardPress = React.useCallback(() => {
    setQuery('')
    setIsActive(false)
  }, [])

  return (
    <View style={[styles.container, pal.view]}>
      <SearchInput
        value={query}
        onChangeText={onChangeText}
        onClearText={onPressCancelSearch}
        onSubmitEditing={onSubmit}
      />
      {query !== '' && isActive && moderationOpts && (
        <View style={[pal.view, pal.borderDark, styles.resultsContainer]}>
          {isFetching && !autocompleteData?.length ? (
            <View style={{padding: 8}}>
              <ActivityIndicator />
            </View>
          ) : (
            <>
              <SearchLinkCard
                label={_(msg`Search for "${query}"`)}
                to={`/search?q=${encodeURIComponent(query)}`}
                style={
                  (autocompleteData?.length ?? 0) > 0
                    ? {borderBottomWidth: 1}
                    : undefined
                }
              />
              {autocompleteData?.map(item => (
                <SearchProfileCard
                  key={item.did}
                  profile={item}
                  moderation={moderateProfile(item, moderationOpts)}
                  onPress={onSearchProfileCardPress}
                />
              ))}
            </>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 300,
  },
  resultsContainer: {
    marginTop: 10,
    flexDirection: 'column',
    width: 300,
    borderWidth: 1,
    borderRadius: 6,
  },
})
