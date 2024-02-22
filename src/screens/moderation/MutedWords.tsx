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
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Divider} from '#/components/Divider'
import {Loader} from '#/components/Loader'
import * as Toggle from '#/components/forms/Toggle'

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
  const [targetContentEnabled, setTargetContentEnabled] = React.useState(true)
  const [targetTagEnabled, setTargetTagEnabled] = React.useState(true)

  const add = React.useCallback(() => {
    if (field.trim()) {
      addMutedWord([
        {
          value: field,
          targets: [
            targetContentEnabled && 'content',
            targetTagEnabled && 'tag',
          ].filter(Boolean) as AppBskyActorDefs.MutedWord['targets'],
        },
      ])
      setField('')
    }
  }, [field, addMutedWord, targetContentEnabled, targetTagEnabled])

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
        <Text
          style={[a.text_md, a.font_bold, a.pb_sm, t.atoms.text_contrast_high]}>
          Add muted words
        </Text>
        <Text style={[a.pb_lg, t.atoms.text_contrast_medium]}>
          Muted words can target a post's content, the posts's tags, or both.
        </Text>

        <TextField.Input
          label="word"
          placeholder="Enter word or tag"
          value={field}
          onChangeText={setField}
          onSubmitEditing={add}
        />

        <View
          style={[
            a.mt_lg,
            a.mb_xl,
            a.flex_row,
            a.align_center,
            a.justify_end,
            a.gap_md,
          ]}>
          <Toggle.Item
            label="Enable on content"
            name="content"
            value={targetContentEnabled}
            onChange={setTargetContentEnabled}>
            <Toggle.Label>Content</Toggle.Label>
            <Toggle.Switch />
          </Toggle.Item>

          <View
            style={[
              {
                width: 1,
                height: 30,
                backgroundColor: t.atoms.border_contrast_low.borderColor,
              },
            ]}
          />

          <Toggle.Item
            label="Enable on content"
            name="tags"
            value={targetTagEnabled}
            onChange={setTargetTagEnabled}>
            <Toggle.Label>Tags</Toggle.Label>
            <Toggle.Switch />
          </Toggle.Item>

          <View
            style={[
              {
                width: 1,
                height: 30,
                backgroundColor: t.atoms.border_contrast_low.borderColor,
              },
            ]}
          />

          <Button
            label="Add"
            size="small"
            color="primary"
            variant="solid"
            style={[a.flex_shrink]}
            onPress={add}>
            <ButtonText>Add</ButtonText>
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
