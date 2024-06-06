import React, {useLayoutEffect, useRef} from 'react'
import type {ListRenderItemInfo, TextInput as RNTextInput} from 'react-native'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {BottomSheetFlatListMethods} from '@discord/bottom-sheet'
import {Trans} from '@lingui/macro'

import {isWeb} from 'platform/detection'
import {WizardAction, WizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, native, useTheme, web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {WizardFeedCard} from '#/components/StarterPack/Wizard/WizardFeedCard'
import {WizardProfileCard} from '#/components/StarterPack/Wizard/WizardProfileCard'
import {Text} from '#/components/Typography'

function keyExtractor(
  item: AppBskyActorDefs.ProfileViewBasic | GeneratorView,
  index: number,
) {
  return `${item.did}-${index}`
}

export function WizardEditListDialog({
  control,
  state,
  dispatch,
}: {
  control: Dialog.DialogControlProps
  state: WizardState
  dispatch: (action: WizardAction) => void
}) {
  const t = useTheme()

  const listRef = useRef<BottomSheetFlatListMethods>(null)
  const inputRef = useRef<RNTextInput>(null)

  useLayoutEffect(() => {
    if (isWeb) {
      setImmediate(() => {
        inputRef?.current?.focus()
      })
    }
  }, [])

  const renderItem = ({item}: ListRenderItemInfo<any>) =>
    state.currentStep === 'Profiles' ? (
      <WizardProfileCard profile={item} state={state} dispatch={dispatch} />
    ) : (
      <WizardFeedCard generator={item} state={state} dispatch={dispatch} />
    )

  return (
    <Dialog.Outer
      control={control}
      testID="newChatDialog"
      nativeOptions={{sheet: {snapPoints: ['95%']}}}>
      <Dialog.Handle />
      <Dialog.InnerFlatList
        ref={listRef}
        data={state.currentStep === 'Profiles' ? state.profiles : state.feeds}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <View
            style={[
              a.align_center,
              a.justify_end,
              a.border_b,
              a.pb_sm,
              a.mb_sm,
              t.atoms.bg,
              t.atoms.border_contrast_medium,
              {height: 68},
            ]}>
            <Text style={[a.font_bold, a.text_xl]}>
              {state.currentStep === 'Profiles' ? (
                <Trans>Edit Profiles</Trans>
              ) : (
                <Trans>Edit Feeds</Trans>
              )}
            </Text>
          </View>
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
        removeClippedSubviews={true}
      />
    </Dialog.Outer>
  )
}
