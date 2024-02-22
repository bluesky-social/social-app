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
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {PageText_Stroke2_Corner0_Rounded as PageText} from '#/components/icons/PageText'
import {Divider} from '#/components/Divider'
import {Loader} from '#/components/Loader'
import {logger} from '#/logger'

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
  const [_error, setError] = React.useState('')

  const submit = React.useCallback(
    async ({
      value,
      targets,
    }: {
      value: string
      targets: AppBskyActorDefs.MutedWord['targets']
    }) => {
      try {
        await addMutedWord([{value, targets}])
        setField('')
      } catch (e: any) {
        logger.error(`Failed to save muted word`, {message: e.message})
        setError(e.message)
      }
    },
    [addMutedWord, setField],
  )

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
          Add muted words and tags
        </Text>
        <Text style={[a.pb_lg, t.atoms.text_contrast_medium]}>
          Posts can be muted based on their content, their tags, or both.
        </Text>

        <TextField.Input
          label="word"
          placeholder="Enter word or tag"
          value={field}
          onChangeText={setField}
          onSubmitEditing={() =>
            submit({value: field, targets: ['tag', 'content']})
          }
        />

        <View
          style={[
            a.my_lg,
            a.flex_row,
            a.align_center,
            a.justify_end,
            a.gap_md,
          ]}>
          <Button
            label="Add"
            size="small"
            color="secondary"
            variant="solid"
            style={[a.flex_shrink]}
            onPress={() => submit({value: field, targets: ['content']})}>
            <ButtonText>Content</ButtonText>
            <ButtonIcon icon={PageText} />
          </Button>

          <Button
            label="Add"
            size="small"
            color="secondary"
            variant="solid"
            style={[a.flex_shrink]}
            onPress={() => submit({value: field, targets: ['tag']})}>
            <ButtonText>Tags</ButtonText>
            <ButtonIcon icon={Hashtag} />
          </Button>

          <Button
            label="Add"
            size="small"
            color="primary"
            variant="solid"
            style={[a.flex_shrink]}
            onPress={() => submit({value: field, targets: ['tag', 'content']})}>
            <ButtonText>Both</ButtonText>
            <ButtonIcon icon={Plus} />
          </Button>
        </View>

        <Divider />

        <View style={[a.pt_2xl]}>
          <Text
            style={[
              a.text_md,
              a.font_bold,
              a.pb_md,
              t.atoms.text_contrast_high,
            ]}>
            Your muted words
          </Text>

          {isPreferencesLoading ? (
            <Loader />
          ) : preferencesError || !preferences ? null : (
            preferences.mutedWords.map((word, i) => (
              <React.Fragment key={word.value}>
                <View
                  style={[
                    a.py_md,
                    a.px_lg,
                    a.flex_row,
                    a.align_center,
                    a.justify_between,
                    a.rounded_md,
                    i % 2 === 0 && t.atoms.bg_contrast_25,
                  ]}>
                  <Text style={[a.font_bold, t.atoms.text_contrast_high]}>
                    {word.value}
                  </Text>

                  <View
                    style={[
                      a.flex_row,
                      a.align_center,
                      a.justify_end,
                      a.gap_sm,
                    ]}>
                    {word.targets.map(target => (
                      <View
                        key={target}
                        style={[
                          a.py_xs,
                          a.px_sm,
                          a.rounded_sm,
                          t.atoms.bg_contrast_100,
                        ]}>
                        <Text
                          style={[
                            a.text_xs,
                            a.font_bold,
                            t.atoms.text_contrast_medium,
                          ]}>
                          {target}
                        </Text>
                      </View>
                    ))}

                    <Button
                      label="Remove"
                      size="tiny"
                      shape="round"
                      variant="ghost"
                      color="secondary"
                      onPress={() => remove(word)}
                      style={[a.ml_sm]}>
                      <ButtonIcon icon={X} />
                    </Button>
                  </View>
                </View>
              </React.Fragment>
            ))
          )}
        </View>
      </View>
    </CenteredView>
  )
}
