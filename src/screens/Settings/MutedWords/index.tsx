import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AppBskyActorDefs} from '@atproto/api'

import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'

import {
  usePreferencesQuery,
  useUpsertMutedWordsMutation,
  useRemoveMutedWordMutation,
  // useUpdateMutedWordMutation,
} from '#/state/queries/preferences'

import {atoms as a, useTheme, useBreakpoints} from '#/alf'
import {Text} from '#/components/Typography'
import * as TextField from '#/components/forms/TextField'
import {Button, ButtonIcon} from '#/components/Button'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Divider} from '#/components/Divider'
import {Loader} from '#/components/Loader'

export function MutedWords() {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {
    isLoading: isPreferencesLoading,
    data: preferences,
    error: preferencesError,
  } = usePreferencesQuery()
  const {mutateAsync: addMutedWord} = useUpsertMutedWordsMutation()
  const {mutateAsync: removeMutedWord} = useRemoveMutedWordMutation()
  const [field, setField] = React.useState('')

  const add = React.useCallback(() => {
    if (field.trim()) {
      addMutedWord([{value: field, targets: ['content']}])
      setField('')
    }
  }, [field, addMutedWord])

  const remove = React.useCallback(
    (word: AppBskyActorDefs.MutedWord) => {
      removeMutedWord(word)
    },
    [removeMutedWord],
  )

  return (
    <CenteredView
      testID="settingsMutedWordsScreen"
      style={[
        a.flex_1,
        a.border,
        t.atoms.border_contrast_low,
        gtMobile && [a.border_l, a.border_r],
      ]}>
      <ViewHeader title={_(msg`Muted words`)} showOnDesktop />

      <View style={[a.p_xl]}>
        <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
          Add muted words and tags
        </Text>

        <View style={[a.mt_md, a.mb_xl, a.flex_row, a.align_center, a.gap_md]}>
          <TextField.Input
            label="word"
            placeholder="Enter word or tag"
            value={field}
            onChangeText={setField}
            onSubmitEditing={add}
          />
          <Button
            label="Add"
            size="small"
            color="primary"
            variant="solid"
            shape="round"
            style={[a.flex_shrink]}
            onPress={add}>
            <ButtonIcon icon={Plus} />
          </Button>
        </View>

        <Divider />

        <View style={[]}>
          {isPreferencesLoading ? (
            <Loader />
          ) : preferencesError || !preferences ? null : (
            preferences.mutedWords.map(word => (
              <React.Fragment key={word.value}>
                <View
                  style={[
                    a.py_md,
                    a.flex_row,
                    a.align_center,
                    a.justify_between,
                  ]}>
                  <Text style={[]}>{word.value}</Text>

                  <Button
                    label="Remove"
                    size="tiny"
                    shape="round"
                    variant="ghost"
                    color="secondary"
                    onPress={() => remove(word)}>
                    <ButtonIcon icon={X} />
                  </Button>
                </View>
                <Divider />
              </React.Fragment>
            ))
          )}
        </View>
      </View>
    </CenteredView>
  )
}
