import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {
  AppBskyActorDefs,
  moderateProfile,
  ModerationDecision,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {s} from '#/lib/styles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {usePalette} from 'lib/hooks/usePalette'
import {MagnifyingGlassIcon2} from 'lib/icons'
import {NavigationProp} from 'lib/routes/types'
import {precacheProfile} from 'state/queries/profile'
import {Link} from '#/view/com/util/Link'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Text} from 'view/com/util/text/Text'
import {atoms as a} from '#/alf'

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
      <View
        style={[{backgroundColor: pal.colors.backgroundLight}, styles.search]}>
        <View style={[styles.inputContainer]}>
          <MagnifyingGlassIcon2
            size={18}
            style={[pal.textLight, styles.iconWrapper]}
          />
          <TextInput
            testID="searchTextInput"
            placeholder={_(msg`Search`)}
            placeholderTextColor={pal.colors.textLight}
            selectTextOnFocus
            returnKeyType="search"
            value={query}
            style={[pal.textLight, styles.input]}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            accessibilityRole="search"
            accessibilityLabel={_(msg`Search`)}
            accessibilityHint=""
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="none"
          />
          {query ? (
            <View style={styles.cancelBtn}>
              <TouchableOpacity
                onPress={onPressCancelSearch}
                accessibilityRole="button"
                accessibilityLabel={_(msg`Cancel search`)}
                accessibilityHint={_(msg`Exits inputting search query`)}
                onAccessibilityEscape={onPressCancelSearch}>
                <Text type="lg" style={[pal.link]}>
                  <Trans>Cancel</Trans>
                </Text>
              </TouchableOpacity>
            </View>
          ) : undefined}
        </View>
      </View>

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
  search: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    width: 300,
    borderRadius: 20,
  },
  inputContainer: {
    flexDirection: 'row',
  },
  iconWrapper: {
    position: 'relative',
    top: 2,
    paddingVertical: 7,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    width: '100%',
    paddingTop: 7,
    paddingBottom: 7,
  },
  cancelBtn: {
    paddingRight: 4,
    paddingLeft: 10,
    paddingVertical: 7,
  },
  resultsContainer: {
    marginTop: 10,
    flexDirection: 'column',
    width: 300,
    borderWidth: 1,
    borderRadius: 6,
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: 10,
  },
})
