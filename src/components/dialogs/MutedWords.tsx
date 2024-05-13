import React from 'react'
import {Keyboard, View} from 'react-native'
import {AppBskyActorDefs, sanitizeMutedWordValue} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {
  usePreferencesQuery,
  useRemoveMutedWordMutation,
  useUpsertMutedWordsMutation,
} from '#/state/queries/preferences'
import {
  atoms as a,
  native,
  useBreakpoints,
  useTheme,
  ViewStyleProp,
  web,
} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {PageText_Stroke2_Corner0_Rounded as PageText} from '#/components/icons/PageText'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

export function MutedWordsDialog() {
  const {mutedWordsDialogControl: control} = useGlobalDialogsControlContext()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <MutedWordsInner />
    </Dialog.Outer>
  )
}

function MutedWordsInner() {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {
    isLoading: isPreferencesLoading,
    data: preferences,
    error: preferencesError,
  } = usePreferencesQuery()
  const {isPending, mutateAsync: addMutedWord} = useUpsertMutedWordsMutation()
  const [field, setField] = React.useState('')
  const [options, setOptions] = React.useState(['content'])
  const [error, setError] = React.useState('')

  const submit = React.useCallback(async () => {
    const sanitizedValue = sanitizeMutedWordValue(field)
    const targets = ['tag', options.includes('content') && 'content'].filter(
      Boolean,
    ) as AppBskyActorDefs.MutedWord['targets']

    if (!sanitizedValue || !targets.length) {
      setField('')
      setError(_(msg`Please enter a valid word, tag, or phrase to mute`))
      return
    }

    try {
      // send raw value and rely on SDK as sanitization source of truth
      await addMutedWord([{value: field, targets}])
      setField('')
    } catch (e: any) {
      logger.error(`Failed to save muted word`, {message: e.message})
      setError(e.message)
    }
  }, [_, field, options, addMutedWord, setField])

  return (
    <Dialog.ScrollableInner label={_(msg`Manage your muted words and tags`)}>
      <View onTouchStart={Keyboard.dismiss}>
        <Text
          style={[a.text_md, a.font_bold, a.pb_sm, t.atoms.text_contrast_high]}>
          <Trans>Add muted words and tags</Trans>
        </Text>
        <Text style={[a.pb_lg, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Posts can be muted based on their text, their tags, or both.
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
            onChangeText={value => {
              if (error) {
                setError('')
              }
              setField(value)
            }}
            onSubmitEditing={submit}
          />

          <Toggle.Group
            label={_(msg`Toggle between muted word options.`)}
            type="radio"
            values={options}
            onChange={setOptions}>
            <View
              style={[
                a.pt_sm,
                a.py_sm,
                a.flex_row,
                a.align_center,
                a.gap_sm,
                a.flex_wrap,
              ]}>
              <Toggle.Item
                label={_(msg`Mute this word in post text and tags`)}
                name="content"
                style={[a.flex_1, !gtMobile && [a.w_full, a.flex_0]]}>
                <TargetToggle>
                  <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                    <Toggle.Radio />
                    <Toggle.LabelText>
                      <Trans>Mute in text & tags</Trans>
                    </Toggle.LabelText>
                  </View>
                  <PageText size="sm" />
                </TargetToggle>
              </Toggle.Item>

              <Toggle.Item
                label={_(msg`Mute this word in tags only`)}
                name="tag"
                style={[a.flex_1, !gtMobile && [a.w_full, a.flex_0]]}>
                <TargetToggle>
                  <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                    <Toggle.Radio />
                    <Toggle.LabelText>
                      <Trans>Mute in tags only</Trans>
                    </Toggle.LabelText>
                  </View>
                  <Hashtag size="sm" />
                </TargetToggle>
              </Toggle.Item>

              <Button
                disabled={isPending || !field}
                label={_(msg`Add mute word for configured settings`)}
                size="small"
                color="primary"
                variant="solid"
                style={[!gtMobile && [a.w_full, a.flex_0]]}
                onPress={submit}>
                <ButtonText>
                  <Trans>Add</Trans>
                </ButtonText>
                <ButtonIcon icon={isPending ? Loader : Plus} />
              </Button>
            </View>
          </Toggle.Group>

          {error && (
            <View
              style={[
                a.mb_lg,
                a.flex_row,
                a.rounded_sm,
                a.p_md,
                a.mb_xs,
                t.atoms.bg_contrast_25,
                {
                  backgroundColor: t.palette.negative_400,
                },
              ]}>
              <Text
                style={[
                  a.italic,
                  {color: t.palette.white},
                  native({marginTop: 2}),
                ]}>
                {error}
              </Text>
            </View>
          )}

          <Text
            style={[
              a.pt_xs,
              a.text_sm,
              a.italic,
              a.leading_snug,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>
              We recommend avoiding common words that appear in many posts,
              since it can result in no posts being shown.
            </Trans>
          </Text>
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
          ) : preferences.moderationPrefs.mutedWords.length ? (
            [...preferences.moderationPrefs.mutedWords]
              .reverse()
              .map((word, i) => (
                <MutedWordRow
                  key={word.value + i}
                  word={word}
                  style={[i % 2 === 0 && t.atoms.bg_contrast_25]}
                />
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

        {isNative && <View style={{height: 20}} />}
      </View>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function MutedWordRow({
  style,
  word,
}: ViewStyleProp & {word: AppBskyActorDefs.MutedWord}) {
  const t = useTheme()
  const {_} = useLingui()
  const {isPending, mutateAsync: removeMutedWord} = useRemoveMutedWordMutation()
  const control = Prompt.usePromptControl()

  const remove = React.useCallback(async () => {
    control.close()
    removeMutedWord(word)
  }, [removeMutedWord, word, control])

  return (
    <>
      <Prompt.Basic
        control={control}
        title={_(msg`Are you sure?`)}
        description={_(
          msg`This will delete ${word.value} from your muted words. You can always add it back later.`,
        )}
        onConfirm={remove}
        confirmButtonCta={_(msg`Remove`)}
        confirmButtonColor="negative"
      />

      <View
        style={[
          a.py_md,
          a.px_lg,
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.rounded_md,
          a.gap_md,
          style,
        ]}>
        <Text
          style={[
            a.flex_1,
            a.leading_snug,
            a.w_full,
            a.font_bold,
            t.atoms.text_contrast_high,
            web({
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }),
          ]}>
          {word.value}
        </Text>

        <View style={[a.flex_row, a.align_center, a.justify_end, a.gap_sm]}>
          {word.targets.map(target => (
            <View
              key={target}
              style={[a.py_xs, a.px_sm, a.rounded_sm, t.atoms.bg_contrast_100]}>
              <Text
                style={[a.text_xs, a.font_bold, t.atoms.text_contrast_medium]}>
                {target === 'content' ? _(msg`text`) : _(msg`tag`)}
              </Text>
            </View>
          ))}

          <Button
            label={_(msg`Remove mute word from your list`)}
            size="tiny"
            shape="round"
            variant="ghost"
            color="secondary"
            onPress={() => control.open()}
            style={[a.ml_sm]}>
            <ButtonIcon icon={isPending ? Loader : X} />
          </Button>
        </View>
      </View>
    </>
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
        ctx.disabled && {
          opacity: 0.8,
        },
      ]}>
      {children}
    </View>
  )
}
