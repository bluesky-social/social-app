import React from 'react'
import {View} from 'react-native'
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
import {useFormatDistance} from '#/components/hooks/dates'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {PageText_Stroke2_Corner0_Rounded as PageText} from '#/components/icons/PageText'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

const ONE_DAY = 24 * 60 * 60 * 1000

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
  const [targets, setTargets] = React.useState(['content'])
  const [error, setError] = React.useState('')
  const [durations, setDurations] = React.useState(['forever'])
  const [excludeFollowing, setExcludeFollowing] = React.useState(false)

  const submit = React.useCallback(async () => {
    const sanitizedValue = sanitizeMutedWordValue(field)
    const surfaces = ['tag', targets.includes('content') && 'content'].filter(
      Boolean,
    ) as AppBskyActorDefs.MutedWord['targets']
    const actorTarget = excludeFollowing ? 'exclude-following' : 'all'

    const now = Date.now()
    const rawDuration = durations.at(0)
    // undefined evaluates to 'forever'
    let duration: string | undefined

    if (rawDuration === '24_hours') {
      duration = new Date(now + ONE_DAY).toISOString()
    } else if (rawDuration === '7_days') {
      duration = new Date(now + 7 * ONE_DAY).toISOString()
    } else if (rawDuration === '30_days') {
      duration = new Date(now + 30 * ONE_DAY).toISOString()
    }

    if (!sanitizedValue || !surfaces.length) {
      setField('')
      setError(_(msg`Please enter a valid word, tag, or phrase to mute`))
      return
    }

    try {
      // send raw value and rely on SDK as sanitization source of truth
      await addMutedWord([
        {
          value: field,
          targets: surfaces,
          actorTarget,
          expiresAt: duration,
        },
      ])
      setField('')
    } catch (e: any) {
      logger.error(`Failed to save muted word`, {message: e.message})
      setError(e.message)
    }
  }, [_, field, targets, addMutedWord, setField, durations, excludeFollowing])

  return (
    <Dialog.ScrollableInner label={_(msg`Manage your muted words and tags`)}>
      <View>
        <Text
          style={[a.text_md, a.font_bold, a.pb_sm, t.atoms.text_contrast_high]}>
          <Trans>Add muted words and tags</Trans>
        </Text>
        <Text style={[a.pb_lg, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Posts can be muted based on their text, their tags, or both. We
            recommend avoiding common words that appear in many posts, since it
            can result in no posts being shown.
          </Trans>
        </Text>

        <View style={[a.pb_sm]}>
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
        </View>

        <View style={[a.pb_xl, a.gap_sm]}>
          <Toggle.Group
            label={_(msg`Select how long to mute this word for.`)}
            type="radio"
            values={durations}
            onChange={setDurations}>
            <Text
              style={[
                a.pb_xs,
                a.text_sm,
                a.font_bold,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>Duration:</Trans>
            </Text>

            <View
              style={[
                gtMobile && [a.flex_row, a.align_center, a.justify_start],
                a.gap_sm,
              ]}>
              <View
                style={[
                  a.flex_1,
                  a.flex_row,
                  a.justify_start,
                  a.align_center,
                  a.gap_sm,
                ]}>
                <Toggle.Item
                  label={_(msg`Mute this word until you unmute it`)}
                  name="forever"
                  style={[a.flex_1]}>
                  <TargetToggle>
                    <View
                      style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                      <Toggle.Radio />
                      <Toggle.LabelText style={[a.flex_1, a.leading_tight]}>
                        <Trans>Forever</Trans>
                      </Toggle.LabelText>
                    </View>
                  </TargetToggle>
                </Toggle.Item>

                <Toggle.Item
                  label={_(msg`Mute this word for 24 hours`)}
                  name="24_hours"
                  style={[a.flex_1]}>
                  <TargetToggle>
                    <View
                      style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                      <Toggle.Radio />
                      <Toggle.LabelText style={[a.flex_1, a.leading_tight]}>
                        <Trans>24 hours</Trans>
                      </Toggle.LabelText>
                    </View>
                  </TargetToggle>
                </Toggle.Item>
              </View>

              <View
                style={[
                  a.flex_1,
                  a.flex_row,
                  a.justify_start,
                  a.align_center,
                  a.gap_sm,
                ]}>
                <Toggle.Item
                  label={_(msg`Mute this word for 7 days`)}
                  name="7_days"
                  style={[a.flex_1]}>
                  <TargetToggle>
                    <View
                      style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                      <Toggle.Radio />
                      <Toggle.LabelText style={[a.flex_1, a.leading_tight]}>
                        <Trans>7 days</Trans>
                      </Toggle.LabelText>
                    </View>
                  </TargetToggle>
                </Toggle.Item>

                <Toggle.Item
                  label={_(msg`Mute this word for 30 days`)}
                  name="30_days"
                  style={[a.flex_1]}>
                  <TargetToggle>
                    <View
                      style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                      <Toggle.Radio />
                      <Toggle.LabelText style={[a.flex_1, a.leading_tight]}>
                        <Trans>30 days</Trans>
                      </Toggle.LabelText>
                    </View>
                  </TargetToggle>
                </Toggle.Item>
              </View>
            </View>
          </Toggle.Group>

          <Toggle.Group
            label={_(msg`Select what content this mute word should apply to.`)}
            type="radio"
            values={targets}
            onChange={setTargets}>
            <Text
              style={[
                a.pb_xs,
                a.text_sm,
                a.font_bold,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>Mute in:</Trans>
            </Text>

            <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
              <Toggle.Item
                label={_(msg`Mute this word in post text and tags`)}
                name="content"
                style={[a.flex_1]}>
                <TargetToggle>
                  <View
                    style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                    <Toggle.Radio />
                    <Toggle.LabelText style={[a.flex_1, a.leading_tight]}>
                      <Trans>Text & tags</Trans>
                    </Toggle.LabelText>
                  </View>
                  <PageText size="sm" />
                </TargetToggle>
              </Toggle.Item>

              <Toggle.Item
                label={_(msg`Mute this word in tags only`)}
                name="tag"
                style={[a.flex_1]}>
                <TargetToggle>
                  <View
                    style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                    <Toggle.Radio />
                    <Toggle.LabelText style={[a.flex_1, a.leading_tight]}>
                      <Trans>Tags only</Trans>
                    </Toggle.LabelText>
                  </View>
                  <Hashtag size="sm" />
                </TargetToggle>
              </Toggle.Item>
            </View>
          </Toggle.Group>

          <View>
            <Text
              style={[
                a.pb_xs,
                a.text_sm,
                a.font_bold,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>Options:</Trans>
            </Text>
            <Toggle.Item
              label={_(msg`Do not apply this mute word to users you follow`)}
              name="exclude_following"
              style={[a.flex_row, a.justify_between]}
              value={excludeFollowing}
              onChange={setExcludeFollowing}>
              <TargetToggle>
                <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                  <Toggle.Checkbox />
                  <Toggle.LabelText style={[a.flex_1, a.leading_tight]}>
                    <Trans>Exclude users you follow</Trans>
                  </Toggle.LabelText>
                </View>
              </TargetToggle>
            </Toggle.Item>
          </View>

          <View style={[a.pt_xs]}>
            <Button
              disabled={isPending || !field}
              label={_(msg`Add mute word for configured settings`)}
              size="large"
              color="primary"
              variant="solid"
              style={[]}
              onPress={submit}>
              <ButtonText>
                <Trans>Add</Trans>
              </ButtonText>
              <ButtonIcon icon={isPending ? Loader : Plus} position="right" />
            </Button>
          </View>

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
  const expiryDate = word.expiresAt ? new Date(word.expiresAt) : undefined
  const isExpired = expiryDate && expiryDate < new Date()
  const formatDistance = useFormatDistance()

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
          msg`This will delete "${word.value}" from your muted words. You can always add it back later.`,
        )}
        onConfirm={remove}
        confirmButtonCta={_(msg`Remove`)}
        confirmButtonColor="negative"
      />

      <View
        style={[
          a.flex_row,
          a.justify_between,
          a.py_md,
          a.px_lg,
          a.rounded_md,
          a.gap_md,
          style,
        ]}>
        <View style={[a.flex_1, a.gap_xs]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <Text
              style={[
                a.flex_1,
                a.leading_snug,
                a.font_bold,
                web({
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }),
              ]}>
              {word.targets.find(t => t === 'content') ? (
                <Trans comment="Pattern: {wordValue} in text, tags">
                  {word.value}{' '}
                  <Text style={[a.font_normal, t.atoms.text_contrast_medium]}>
                    in{' '}
                    <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
                      text & tags
                    </Text>
                  </Text>
                </Trans>
              ) : (
                <Trans comment="Pattern: {wordValue} in tags">
                  {word.value}{' '}
                  <Text style={[a.font_normal, t.atoms.text_contrast_medium]}>
                    in{' '}
                    <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
                      tags
                    </Text>
                  </Text>
                </Trans>
              )}
            </Text>
          </View>

          {(expiryDate || word.actorTarget === 'exclude-following') && (
            <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
              <Text
                style={[
                  a.flex_1,
                  a.text_xs,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                {expiryDate && (
                  <>
                    {isExpired ? (
                      <Trans>Expired</Trans>
                    ) : (
                      <Trans>
                        Expires{' '}
                        {formatDistance(expiryDate, new Date(), {
                          addSuffix: true,
                        })}
                      </Trans>
                    )}
                  </>
                )}
                {word.actorTarget === 'exclude-following' && (
                  <>
                    {' • '}
                    <Trans>Excludes users you follow</Trans>
                  </>
                )}
              </Text>
            </View>
          )}
        </View>

        <Button
          label={_(msg`Remove mute word from your list`)}
          size="tiny"
          shape="round"
          variant="outline"
          color="secondary"
          onPress={() => control.open()}
          style={[a.ml_sm]}>
          <ButtonIcon icon={isPending ? Loader : X} />
        </Button>
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
        t.atoms.bg_contrast_25,
        (ctx.hovered || ctx.focused) && t.atoms.bg_contrast_50,
        ctx.selected && [
          {
            backgroundColor: t.palette.primary_50,
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
