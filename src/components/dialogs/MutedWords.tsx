import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AppBskyActorDefs} from '@atproto/api'

import {
  usePreferencesQuery,
  useUpsertMutedWordsMutation,
  useRemoveMutedWordMutation,
} from '#/state/queries/preferences'

import {atoms as a, useTheme, useBreakpoints} from '#/alf'
import {Text} from '#/components/Typography'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {PageText_Stroke2_Corner0_Rounded as PageText} from '#/components/icons/PageText'
import {Divider} from '#/components/Divider'
import {Loader} from '#/components/Loader'
import {logger} from '#/logger'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'

export {useDialogControl as useMutedWordsDialogControl} from '#/components/Dialog'

export function MutedWordsDialog({
  control,
}: {
  control: Dialog.DialogOuterProps['control']
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <MutedWordsInner control={control} />
    </Dialog.Outer>
  )
}

function MutedWordsInner({}: {control: Dialog.DialogOuterProps['control']}) {
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
  const [contentTargetEnabled, setContentTargetEnabled] = React.useState(false)
  const [tagTargetEnabled, setTagTargetEnabled] = React.useState(false)
  const [_error, setError] = React.useState('')

  const submit = React.useCallback(async () => {
    const value = field.trim()
    const targets = [
      tagTargetEnabled && 'tag',
      contentTargetEnabled && 'content',
    ].filter(Boolean) as AppBskyActorDefs.MutedWord['targets']

    if (!value || !targets.length) return

    try {
      await addMutedWord([{value, targets}])
      setField('')
      setContentTargetEnabled(false)
      setTagTargetEnabled(false)
    } catch (e: any) {
      logger.error(`Failed to save muted word`, {message: e.message})
      setError(e.message)
    }
  }, [field, tagTargetEnabled, contentTargetEnabled, addMutedWord, setField])

  const remove = React.useCallback(
    (word: AppBskyActorDefs.MutedWord) => {
      removeMutedWord(word)
    },
    [removeMutedWord],
  )

  return (
    <Dialog.ScrollableInner label={_(msg`Manage your muted words and tags`)}>
      <Text
        style={[a.text_md, a.font_bold, a.pb_sm, t.atoms.text_contrast_high]}>
        <Trans>Add muted words and tags</Trans>
      </Text>
      <Text style={[a.pb_lg, a.leading_snug, t.atoms.text_contrast_medium]}>
        <Trans>
          Posts can be muted based on their content, their tags, or both.
        </Trans>
      </Text>

      <View style={[a.pb_lg]}>
        <Dialog.Input
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="off"
          label={_(msg`Enter a word or tag`)}
          placeholder={_(msg`Enter a word or tag`)}
          value={field}
          onChangeText={setField}
          onSubmitEditing={submit}
        />

        <View
          style={[
            a.pt_sm,
            a.mb_lg,
            a.flex_row,
            a.align_center,
            a.gap_md,
            a.flex_wrap,
          ]}>
          <Toggle.Item
            label={_(msg`Mute this tag in post content`)}
            name="content"
            value={contentTargetEnabled}
            onChange={setContentTargetEnabled}
            style={[a.flex_1]}>
            <TargetToggle>
              <PageText size="sm" />
              <Toggle.Label>
                <Trans>Mute in content</Trans>
              </Toggle.Label>
            </TargetToggle>
          </Toggle.Item>

          <Toggle.Item
            label={_(msg`Mute this tag in post tags`)}
            name="tag"
            value={tagTargetEnabled}
            onChange={setTagTargetEnabled}
            style={[a.flex_1]}>
            <TargetToggle>
              <Hashtag size="sm" />
              <Toggle.Label>
                <Trans>Mute in tags</Trans>
              </Toggle.Label>
            </TargetToggle>
          </Toggle.Item>

          <Button
            disabled={
              !field ||
              Boolean(field && !contentTargetEnabled && !tagTargetEnabled)
            }
            label={_(msg`Add mute word for configured settings`)}
            size="small"
            color="primary"
            variant="solid"
            style={[!gtMobile && [a.w_full, a.flex_0]]}
            onPress={submit}>
            <ButtonText>
              <Trans>Add</Trans>
            </ButtonText>
            <ButtonIcon icon={Plus} />
          </Button>
        </View>

        <View style={[a.flex_row, a.justify_end]} />
      </View>

      <Divider />

      <View style={[a.pt_2xl]}>
        <Text
          style={[a.text_md, a.font_bold, a.pb_md, t.atoms.text_contrast_high]}>
          <Trans>Your muted words</Trans>
        </Text>

        {isPreferencesLoading ? (
          <Loader />
        ) : preferencesError || !preferences ? (
          <View
            style={[a.py_md, a.px_lg, a.rounded_md, t.atoms.bg_contrast_25]}>
            <Text style={[a.italic, t.atoms.text_contrast_high]}>
              <Trans>
                We're sorry, but we weren't able to load your muted words at
                this time. Please try again.
              </Trans>
            </Text>
          </View>
        ) : preferences.mutedWords.length ? (
          [...preferences.mutedWords].reverse().map((word, i) => (
            <View
              key={word.value + i}
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
                style={[a.flex_row, a.align_center, a.justify_end, a.gap_sm]}>
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
                  label={_(msg`Remove mute word from your list`)}
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
          ))
        ) : (
          <View
            style={[a.py_md, a.px_lg, a.rounded_md, t.atoms.bg_contrast_25]}>
            <Text style={[a.italic, t.atoms.text_contrast_high]}>
              <Trans>You haven't muted any words or tags yet</Trans>
            </Text>
          </View>
        )}
      </View>
    </Dialog.ScrollableInner>
  )
}

function TargetToggle({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  const ctx = Toggle.useItemContext()
  const {gtMobile} = useBreakpoints()
  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.gap_xs,
        a.flex_1,
        a.py_sm,
        a.px_sm,
        gtMobile && a.px_md,
        a.rounded_sm,
        t.atoms.bg_contrast_50,
        (ctx.hovered || ctx.focused) && t.atoms.bg_contrast_100,
        ctx.selected && [
          {
            backgroundColor:
              t.name === 'light' ? t.palette.primary_50 : t.palette.primary_975,
          },
        ],
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_xs]}>{children}</View>
      <Toggle.Checkbox />
    </View>
  )
}
