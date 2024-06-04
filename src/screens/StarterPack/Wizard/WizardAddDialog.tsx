import React, {useLayoutEffect, useRef, useState} from 'react'
import type {ListRenderItemInfo, TextInput as RNTextInput} from 'react-native'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {BottomSheetFlatListMethods} from '@discord/bottom-sheet'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isWeb} from 'platform/detection'
import {useActorAutocompleteQuery} from 'state/queries/actor-autocomplete'
import {useProfileFollowsQuery} from 'state/queries/profile-follows'
import {useSession} from 'state/session'
import {WizardAction, WizardState} from '#/screens/StarterPack/Wizard/State'
import {WizardProfileCard} from '#/screens/StarterPack/Wizard/StepProfiles/WizardProfileCard'
import {atoms as a, native, useTheme, web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {TextInput} from '#/components/dms/dialogs/TextInput'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Text} from '#/components/Typography'

function keyExtractor(item: AppBskyActorDefs.ProfileViewBasic) {
  return item.did
}

export function WizardAddDialog({
  control,
  state,
  dispatch,
}: {
  control: Dialog.DialogControlProps
  state: WizardState
  dispatch: (action: WizardAction) => void
}) {
  const [searchText, setSearchText] = useState('')

  const {currentAccount} = useSession()
  const {data: results} = useActorAutocompleteQuery(searchText, true, 12)
  const {data: followsPages, fetchNextPage} = useProfileFollowsQuery(
    currentAccount?.did,
  )
  const follows = followsPages?.pages.flatMap(page => page.follows) || []

  const listRef = useRef<BottomSheetFlatListMethods>(null)
  const inputRef = useRef<RNTextInput>(null)

  useLayoutEffect(() => {
    if (isWeb) {
      setImmediate(() => {
        inputRef?.current?.focus()
      })
    }
  }, [])

  const renderItem = ({
    item,
  }: ListRenderItemInfo<AppBskyActorDefs.ProfileViewBasic>) => {
    return (
      <WizardProfileCard profile={item} state={state} dispatch={dispatch} />
    )
  }

  return (
    <Dialog.Outer
      control={control}
      testID="newChatDialog"
      nativeOptions={{sheet: {snapPoints: ['100%']}}}>
      <Dialog.InnerFlatList
        ref={listRef}
        data={searchText.length > 0 ? results : follows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <ListHeader
            searchText={searchText}
            setSearchText={setSearchText}
            inputRef={inputRef}
          />
        }
        stickyHeaderIndices={[0]}
        style={[
          web([a.py_0, {height: '100vh', maxHeight: 600}, a.px_0]),
          native({
            height: '100%',
            paddingHorizontal: 0,
            marginTop: 0,
            paddingTop: 0,
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
          }),
        ]}
        webInnerStyle={[a.py_0, {maxWidth: 500, minWidth: 200}]}
        keyboardDismissMode="on-drag"
        onEndReached={() => fetchNextPage()}
        onEndReachedThreshold={2}
        removeClippedSubviews={true}
      />
    </Dialog.Outer>
  )
}

function ListHeader({
  searchText,
  setSearchText,
  inputRef,
}: {
  searchText: string
  setSearchText: (text: string) => void
  inputRef: React.Ref<RNTextInput>
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const interacted = hovered || focused

  return (
    <View
      style={[
        a.relative,
        a.pt_md,
        a.pb_xs,
        a.px_lg,
        a.border_b,
        t.atoms.border_contrast_low,
        t.atoms.bg,
        native([a.pt_lg]),
      ]}>
      <View
        style={[
          a.relative,
          native(a.align_center),
          a.justify_center,
          {height: 32},
        ]}>
        <Text
          style={[
            a.z_10,
            a.text_lg,
            a.font_bold,
            a.leading_tight,
            t.atoms.text_contrast_high,
          ]}>
          <Trans>Select profiles to add</Trans>
        </Text>
      </View>

      <View style={[native([a.pt_sm]), web([a.pt_xs])]}>
        <View
          {...web({
            onMouseEnter,
            onMouseLeave,
          })}
          style={[a.flex_row, a.align_center, a.gap_sm]}>
          <Search
            size="md"
            fill={interacted ? t.palette.primary_500 : t.palette.contrast_300}
          />

          <TextInput
            // @ts-ignore bottom sheet input types issue — esb
            ref={inputRef}
            placeholder={_(msg`Search`)}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={onFocus}
            onBlur={onBlur}
            style={[a.flex_1, a.py_md, a.text_md, t.atoms.text]}
            placeholderTextColor={t.palette.contrast_500}
            keyboardAppearance={t.name === 'light' ? 'light' : 'dark'}
            returnKeyType="search"
            clearButtonMode="while-editing"
            maxLength={50}
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="none"
            autoFocus
            accessibilityLabel={_(msg`Search profiles`)}
            accessibilityHint={_(msg`Search profiles`)}
          />
        </View>
      </View>
    </View>
  )
}
