import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AppBskyLabelerDefs} from '@atproto/api'

import {getModerationServiceTitle} from '#/lib/moderation'
import {ReportOption} from '#/lib/moderation/useReportOptions'

import {atoms as a, useTheme, tokens, native} from '#/alf'
import {Text} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft} from '#/components/icons/Chevron'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {GradientFill} from '#/components/GradientFill'
import * as Toggle from '#/components/forms/Toggle'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import {Loader} from '#/components/Loader'
import * as Toast from '#/view/com/util/Toast'

import {ReportDialogProps} from './types'

export function SubmitView({
  params,
  labelers,
  selectedReportOption,
  goBack,
  onSubmitComplete,
}: ReportDialogProps & {
  labelers: AppBskyLabelerDefs.LabelerViewDetailed[]
  selectedReportOption: ReportOption
  goBack: () => void
  onSubmitComplete: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const [details, setDetails] = React.useState<string>('')
  const [submitting, setSubmitting] = React.useState<boolean>(false)
  const [selectedServices, setSelectedServices] = React.useState<string[]>(
    labelers?.map(labeler => labeler.creator.did) || [],
  )

  const submit = React.useCallback(async () => {
    setSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const $type =
      params.type === 'account'
        ? 'com.atproto.admin.defs#repoRef'
        : 'com.atproto.repo.strongRef'
    const report = {
      reasonType: selectedReportOption.reason,
      subject: {
        $type,
        ...params,
      },
      reason: details,
    }
    console.log(report)
    // await getAgent().createModerationReport(report)

    setSubmitting(false)

    Toast.show(`Thank you. Your report has been sent.`)

    onSubmitComplete()
  }, [params, details, selectedReportOption, onSubmitComplete])

  return (
    <View style={[a.gap_2xl]}>
      <Button
        size="small"
        variant="solid"
        color="secondary"
        shape="round"
        label={_(msg`Go back to previous step`)}
        onPress={goBack}>
        <ButtonIcon icon={ChevronLeft} />
      </Button>

      <View
        style={[
          a.w_full,
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_lg,
          a.p_md,
          a.rounded_md,
          t.atoms.bg_contrast_25,
        ]}>
        <View style={[a.flex_1, a.gap_xs]}>
          <Text style={[a.text_md, a.font_bold]}>
            {selectedReportOption.title}
          </Text>
          <Text style={[a.leading_tight, {maxWidth: 400}]}>
            {selectedReportOption.description}
          </Text>
        </View>

        <Check size="md" style={[a.pr_sm]} />
      </View>

      <View style={[a.gap_md]}>
        <Text style={[t.atoms.text_contrast_medium]}>
          <Trans>Select the moderation service(s) to report to</Trans>
        </Text>

        <Toggle.Group
          label="Select mod services"
          values={selectedServices}
          onChange={setSelectedServices}>
          <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
            {labelers.map(labeler => {
              const title = getModerationServiceTitle({
                displayName: labeler.creator.displayName,
                handle: labeler.creator.handle,
              })
              return (
                <Toggle.Item
                  key={labeler.creator.did}
                  name={labeler.creator.did}
                  label={title}>
                  <LabelerToggle title={title} />
                </Toggle.Item>
              )
            })}
          </View>
        </Toggle.Group>
      </View>
      <View style={[a.gap_md]}>
        <Text style={[t.atoms.text_contrast_medium]}>
          <Trans>Optionally provide additional information below:</Trans>
        </Text>

        <View style={[a.relative, a.w_full]}>
          <Dialog.Input
            multiline
            value={details}
            onChangeText={setDetails}
            label="Text field"
            style={{paddingRight: 60}}
            numberOfLines={6}
          />

          <View
            style={[
              a.absolute,
              a.flex_row,
              a.align_center,
              a.pr_md,
              a.pb_sm,
              {
                bottom: 0,
                right: 0,
              },
            ]}>
            <CharProgress count={details?.length || 0} />
          </View>
        </View>
      </View>

      <View style={[a.flex_row, a.align_center, a.justify_end, a.gap_lg]}>
        {!selectedServices.length && (
          <Text
            style={[
              a.flex_1,
              a.italic,
              a.leading_snug,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>You must select at least one labeler for a report</Trans>
          </Text>
        )}

        <Button
          size="large"
          variant="solid"
          color="primary"
          label={_(msg`Submit`)}
          onPress={submit}
          disabled={!selectedServices.length}>
          <ButtonText>Submit</ButtonText>
          {submitting && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </View>
  )
}

function LabelerToggle({title}: {title: string}) {
  const t = useTheme()
  const ctx = Toggle.useItemContext()

  return (
    <View
      style={[
        a.py_md,
        a.px_xl,
        a.rounded_full,
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
      ]}>
      {ctx.selected && <GradientFill gradient={tokens.gradients.midnight} />}
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_lg,
          a.z_10,
        ]}>
        <Text
          style={[
            native({marginTop: 2}),
            {
              color:
                t.name === 'light' && ctx.selected
                  ? t.palette.white
                  : t.atoms.text.color,
            },
          ]}>
          {title}
        </Text>
        <Plus
          size="sm"
          fill={
            ctx.selected
              ? t.palette.primary_200
              : t.atoms.text_contrast_low.color
          }
        />
      </View>
    </View>
  )
}
