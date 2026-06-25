import {useCallback, useMemo, useRef, useState} from 'react'
import {type ScrollView, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {wait} from '#/lib/async/wait'
import {
  useApplyLabelMutation,
  useMyAppliedLabelsQuery,
  usePostBlackskyLabelsQuery,
  useRemoveLabelMutation,
} from '#/state/queries/peer-mod-label'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import {atoms as a, useGutters, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDelayedLoading} from '#/components/hooks/useDelayedLoading'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlane} from '#/components/icons/PaperPlane'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {
  type ResolvedLabelStrings,
  resolveLabelStrings,
  useBlackskyLabelDefs,
} from './blackskyLabels'

export {useDialogControl as useLabelDialogControl} from '#/components/Dialog'

export type LabelDialogSubject = {
  uri: string
  cid: string
}

export type LabelDialogProps = {
  control: Dialog.DialogOuterProps['control']
  subject?: LabelDialogSubject
  onAfterSubmit?: () => void
}

export function LabelDialog(props: LabelDialogProps) {
  return (
    <Dialog.Outer control={props.control}>
      <Dialog.Handle />
      {props.subject ? <Inner {...props} subject={props.subject} /> : null}
    </Dialog.Outer>
  )
}

function Inner({
  subject,
  control,
  onAfterSubmit,
}: LabelDialogProps & {subject: LabelDialogSubject}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const ref = useRef<ScrollView>(null)

  const {defs, isLoading: defsLoading} = useBlackskyLabelDefs()
  const isLoading = useDelayedLoading(500, defsLoading)
  const {data: postLabels = []} = usePostBlackskyLabelsQuery(subject.uri)
  const {data: myLabels = []} = useMyAppliedLabelsQuery(subject.uri)

  const apply = useApplyLabelMutation()
  const remove = useRemoveLabelMutation()

  const [selectedVal, setSelectedVal] = useState<string | undefined>(undefined)
  const [details, setDetails] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [isSuccess, setSuccess] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const selectedDef = useMemo(
    () => defs.find(d => d.identifier === selectedVal),
    [defs, selectedVal],
  )

  const onSubmit = useCallback(async () => {
    if (!selectedVal) return
    setError(undefined)
    try {
      await wait(
        1e3,
        apply.mutateAsync({
          subjectUri: subject.uri,
          subjectCid: subject.cid,
          val: selectedVal,
          reason: details || undefined,
        }),
      )
      setSuccess(true)
      setTimeout(() => {
        control.close(() => onAfterSubmit?.())
      }, 1e3)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : _(msg`Something went wrong. Try again.`),
      )
    }
  }, [
    _,
    apply,
    control,
    details,
    onAfterSubmit,
    selectedVal,
    subject.cid,
    subject.uri,
  ])

  return (
    <Dialog.ScrollableInner
      testID="label:dialog"
      label={_(msg`Label post`)}
      ref={ref}
      style={[a.w_full, {maxWidth: 500}]}>
      <View style={[a.gap_2xl]}>
        <StepOuter>
          <StepTitle
            index={1}
            title={_(msg`Select a label`)}
            activeIndex1={selectedVal ? 2 : 1}
          />
          <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              Labels are applied by Blacksky Moderation. You can remove labels
              you applied yourself.
            </Trans>
          </Text>

          {isLoading ? (
            <View style={[a.gap_sm]}>
              <LabelCardSkeleton />
              <LabelCardSkeleton />
              <LabelCardSkeleton />
            </View>
          ) : selectedDef ? (
            <LabelCard
              strings={resolveLabelStrings(selectedDef, i18n.locale)}
              state="selected"
              onClear={() => {
                setSelectedVal(undefined)
                setDetailsOpen(false)
              }}
            />
          ) : (
            <View style={[a.gap_sm]}>
              {defs.map(def => {
                const strings = resolveLabelStrings(def, i18n.locale)
                const appliedByMe = myLabels.includes(def.identifier)
                const appliedByOther =
                  !appliedByMe && postLabels.includes(def.identifier)
                return (
                  <LabelCard
                    key={def.identifier}
                    strings={strings}
                    state={
                      appliedByMe
                        ? 'appliedByMe'
                        : appliedByOther
                          ? 'appliedByOther'
                          : 'selectable'
                    }
                    removing={
                      remove.isPending &&
                      remove.variables?.val === def.identifier
                    }
                    onSelect={() => setSelectedVal(def.identifier)}
                    onRemove={() =>
                      remove.mutate({subjectUri: subject.uri, val: def.identifier})
                    }
                  />
                )
              })}
            </View>
          )}
        </StepOuter>

        <StepOuter>
          <StepTitle
            index={2}
            title={_(msg`Apply label`)}
            activeIndex1={selectedVal ? 2 : 1}
          />
          {selectedDef && (
            <>
              <View style={[a.pb_xs, a.gap_xs]}>
                <Text style={[a.leading_snug, a.pb_xs]}>
                  <Trans>
                    This label will be applied by Blacksky Moderation.
                  </Trans>{' '}
                  {!detailsOpen ? (
                    <Text
                      style={[a.leading_snug, {color: t.palette.primary_500}]}
                      onPress={() => setDetailsOpen(true)}>
                      <Trans>Add a note (optional)</Trans>
                    </Text>
                  ) : null}
                </Text>

                {detailsOpen && (
                  <View>
                    <Dialog.Input
                      testID="label:details"
                      multiline
                      value={details}
                      onChangeText={setDetails}
                      label={_(msg`Note (limit 300 characters)`)}
                      style={{paddingRight: 60}}
                      numberOfLines={4}
                    />
                    <View
                      style={[
                        a.absolute,
                        a.flex_row,
                        a.align_center,
                        a.pr_md,
                        a.pb_sm,
                        {bottom: 0, right: 0},
                      ]}>
                      <CharProgress count={details.length} />
                    </View>
                  </View>
                )}
              </View>

              <Button
                testID="label:submit"
                label={_(msg`Label post`)}
                size="large"
                variant="solid"
                color="primary"
                disabled={apply.isPending || isSuccess}
                onPress={onSubmit}>
                <ButtonText>
                  <Trans>Label post</Trans>
                </ButtonText>
                <ButtonIcon
                  icon={isSuccess ? Check : apply.isPending ? Loader : PaperPlane}
                />
              </Button>

              {error && (
                <Admonition.Admonition type="error">
                  {error}
                </Admonition.Admonition>
              )}
            </>
          )}
        </StepOuter>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function StepOuter({children}: {children: React.ReactNode}) {
  return <View style={[a.gap_md, a.w_full]}>{children}</View>
}

function StepTitle({
  index,
  title,
  activeIndex1,
}: {
  index: number
  title: string
  activeIndex1: number
}) {
  const t = useTheme()
  const active = activeIndex1 === index
  const completed = activeIndex1 > index
  return (
    <View style={[a.flex_row, a.gap_sm, a.pr_3xl]}>
      <View
        style={[
          a.justify_center,
          a.align_center,
          a.rounded_full,
          a.border,
          {
            width: 24,
            height: 24,
            backgroundColor: active
              ? t.palette.primary_500
              : completed
                ? t.palette.primary_100
                : t.atoms.bg_contrast_25.backgroundColor,
            borderColor: active
              ? t.palette.primary_500
              : completed
                ? t.palette.primary_400
                : t.atoms.border_contrast_low.borderColor,
          },
        ]}>
        {completed ? (
          <Check width={12} />
        ) : (
          <Text
            style={[
              a.font_bold,
              a.text_center,
              {
                color: active ? 'white' : t.atoms.text_contrast_medium.color,
                fontVariant: ['tabular-nums'],
                width: 24,
                height: 24,
                lineHeight: 24,
              },
            ]}>
            {index}
          </Text>
        )}
      </View>
      <Text
        style={[
          a.flex_1,
          a.font_bold,
          a.text_lg,
          a.leading_snug,
          active ? t.atoms.text : t.atoms.text_contrast_medium,
          {top: 1},
        ]}>
        {title}
      </Text>
    </View>
  )
}

type LabelCardState =
  | 'selectable'
  | 'selected'
  | 'appliedByMe'
  | 'appliedByOther'

function LabelCard({
  strings,
  state,
  removing,
  onSelect,
  onRemove,
  onClear,
}: {
  strings: ResolvedLabelStrings
  state: LabelCardState
  removing?: boolean
  onSelect?: () => void
  onRemove?: () => void
  onClear?: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters(['compact'])
  const interactive = state === 'selectable'

  return (
    <View style={[a.flex_row, a.align_center, a.gap_md]}>
      <Button
        testID={`label:option:${strings.name}`}
        label={_(msg`Apply label ${strings.name}`)}
        onPress={() => onSelect?.()}
        disabled={!interactive}
        style={[a.flex_1]}>
        {({hovered, pressed}) => (
          <View
            style={[
              a.w_full,
              gutters,
              a.py_sm,
              a.rounded_sm,
              a.border,
              t.atoms.bg_contrast_25,
              (hovered || pressed) && interactive
                ? [t.atoms.border_contrast_high]
                : [t.atoms.border_contrast_low],
              state === 'appliedByOther' && {opacity: 0.6},
            ]}>
            <View style={[a.flex_row, a.align_center, a.gap_sm]}>
              <Text style={[a.flex_1, a.text_md, a.font_semi_bold, a.leading_snug]}>
                {strings.name}
              </Text>
              {(state === 'appliedByMe' || state === 'appliedByOther') && (
                <Text
                  style={[a.text_xs, a.font_bold, t.atoms.text_contrast_medium]}>
                  {state === 'appliedByMe' ? (
                    <Trans>Applied by you</Trans>
                  ) : (
                    <Trans>Already applied</Trans>
                  )}
                </Text>
              )}
            </View>
            {!!strings.description && (
              <Text
                style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
                {strings.description}
              </Text>
            )}
          </View>
        )}
      </Button>

      {state === 'selected' && (
        <Button
          label={_(msg`Change label`)}
          size="tiny"
          variant="solid"
          color="secondary"
          shape="round"
          onPress={() => onClear?.()}>
          <ButtonIcon icon={Trash} />
        </Button>
      )}

      {state === 'appliedByMe' && (
        <Button
          testID={`label:remove:${strings.name}`}
          label={_(msg`Remove label ${strings.name}`)}
          size="tiny"
          variant="solid"
          color="negative_subtle"
          shape="round"
          disabled={removing}
          onPress={() => onRemove?.()}>
          <ButtonIcon icon={removing ? Loader : Trash} />
        </Button>
      )}
    </View>
  )
}

function LabelCardSkeleton() {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        {height: 64},
      ]}
    />
  )
}
