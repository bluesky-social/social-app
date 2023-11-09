import React, {useEffect, useCallback, useState, useMemo} from 'react'
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {ScrollView, TextInput} from './util'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import {UserAvatar} from '../util/UserAvatar'
import * as Toast from '../util/Toast'
import {useStores} from 'state/index'
import {ListModel} from 'state/models/content/list'
import {UserAutocompleteModel} from 'state/models/discovery/user-autocomplete'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useIsKeyboardVisible} from 'lib/hooks/useIsKeyboardVisible'
import {cleanError} from 'lib/strings/errors'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {HITSLOP_20} from '#/lib/constants'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'

export const snapPoints = ['90%']

export const Component = observer(function Component({
  list,
  onAdd,
}: {
  list: ListModel
  onAdd?: (profile: AppBskyActorDefs.ProfileViewBasic) => void
}) {
  const pal = usePalette('default')
  const store = useStores()
  const {_} = useLingui()
  const {closeModal} = useModalControls()
  const {isMobile} = useWebMediaQueries()
  const [query, setQuery] = useState('')
  const autocompleteView = useMemo<UserAutocompleteModel>(
    () => new UserAutocompleteModel(store),
    [store],
  )
  const [isKeyboardVisible] = useIsKeyboardVisible()

  // initial setup
  useEffect(() => {
    autocompleteView.setup().then(() => {
      autocompleteView.setPrefix('')
    })
    autocompleteView.setActive(true)
    list.loadAll()
  }, [autocompleteView, list])

  const onChangeQuery = useCallback(
    (text: string) => {
      setQuery(text)
      autocompleteView.setPrefix(text)
    },
    [setQuery, autocompleteView],
  )

  const onPressCancelSearch = useCallback(
    () => onChangeQuery(''),
    [onChangeQuery],
  )

  return (
    <SafeAreaView
      testID="listAddUserModal"
      style={[pal.view, isWeb ? styles.fixedHeight : s.flex1]}>
      <View style={[s.flex1, isMobile && {paddingHorizontal: 18}]}>
        <View style={[styles.searchContainer, pal.border]}>
          <FontAwesomeIcon icon="search" size={16} />
          <TextInput
            testID="searchInput"
            style={[styles.searchInput, pal.border, pal.text]}
            placeholder="Search for users"
            placeholderTextColor={pal.colors.textLight}
            value={query}
            onChangeText={onChangeQuery}
            accessible={true}
            accessibilityLabel={_(msg`Search`)}
            accessibilityHint=""
            autoFocus
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            selectTextOnFocus
          />
          {query ? (
            <Pressable
              onPress={onPressCancelSearch}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Cancel search`)}
              accessibilityHint="Exits inputting search query"
              onAccessibilityEscape={onPressCancelSearch}
              hitSlop={HITSLOP_20}>
              <FontAwesomeIcon
                icon="xmark"
                size={16}
                color={pal.colors.textLight}
              />
            </Pressable>
          ) : undefined}
        </View>
        <ScrollView
          style={[s.flex1]}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always">
          {autocompleteView.isLoading ? (
            <View style={{marginVertical: 20}}>
              <ActivityIndicator />
            </View>
          ) : autocompleteView.suggestions.length ? (
            <>
              {autocompleteView.suggestions.slice(0, 40).map((item, i) => (
                <UserResult
                  key={item.did}
                  list={list}
                  profile={item}
                  noBorder={i === 0}
                  onAdd={onAdd}
                />
              ))}
            </>
          ) : (
            <Text
              type="xl"
              style={[
                pal.textLight,
                {paddingHorizontal: 12, paddingVertical: 16},
              ]}>
              <Trans>No results found for {autocompleteView.prefix}</Trans>
            </Text>
          )}
        </ScrollView>
        <View
          style={[
            styles.btnContainer,
            {paddingBottom: isKeyboardVisible ? 10 : 20},
          ]}>
          <Button
            testID="doneBtn"
            type="default"
            onPress={() => closeModal()}
            accessibilityLabel={_(msg`Done`)}
            accessibilityHint=""
            label="Done"
            labelContainerStyle={{justifyContent: 'center', padding: 4}}
            labelStyle={[s.f18]}
          />
        </View>
      </View>
    </SafeAreaView>
  )
})

function UserResult({
  profile,
  list,
  noBorder,
  onAdd,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  list: ListModel
  noBorder: boolean
  onAdd?: (profile: AppBskyActorDefs.ProfileViewBasic) => void | undefined
}) {
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAdded, setIsAdded] = useState(list.isMember(profile.did))

  const onPressAdd = useCallback(async () => {
    setIsProcessing(true)
    try {
      await list.addMember(profile)
      Toast.show('Added to list')
      setIsAdded(true)
      onAdd?.(profile)
    } catch (e) {
      Toast.show(cleanError(e))
    } finally {
      setIsProcessing(false)
    }
  }, [list, profile, setIsProcessing, setIsAdded, onAdd])

  return (
    <View
      style={[
        pal.border,
        {
          flexDirection: 'row',
          alignItems: 'center',
          borderTopWidth: noBorder ? 0 : 1,
          paddingHorizontal: 8,
        },
      ]}>
      <View
        style={{
          width: 54,
          paddingLeft: 4,
        }}>
        <UserAvatar size={40} avatar={profile.avatar} />
      </View>
      <View
        style={{
          flex: 1,
          paddingRight: 10,
          paddingTop: 10,
          paddingBottom: 10,
        }}>
        <Text
          type="lg"
          style={[s.bold, pal.text]}
          numberOfLines={1}
          lineHeight={1.2}>
          {sanitizeDisplayName(
            profile.displayName || sanitizeHandle(profile.handle),
          )}
        </Text>
        <Text type="md" style={[pal.textLight]} numberOfLines={1}>
          {sanitizeHandle(profile.handle, '@')}
        </Text>
        {!!profile.viewer?.followedBy && <View style={s.flexRow} />}
      </View>
      <View>
        {isAdded ? (
          <FontAwesomeIcon icon="check" />
        ) : isProcessing ? (
          <ActivityIndicator />
        ) : (
          <Button
            testID={`user-${profile.handle}-addBtn`}
            type="default"
            label="Add"
            onPress={onPressAdd}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixedHeight: {
    // @ts-ignore web only -prf
    height: '80vh',
  },
  titleSection: {
    paddingTop: isWeb ? 0 : 4,
    paddingBottom: isWeb ? 14 : 10,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    fontSize: 16,
    flex: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.blue3,
  },
  btnContainer: {
    paddingTop: 10,
  },
})
