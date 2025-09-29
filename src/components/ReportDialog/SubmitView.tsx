import React from 'react'
import {View} from 'react-native'
import {type AppBskyLabelerDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {getLabelingServiceTitle} from '#/lib/moderation'
import {type ReportOption} from '#/lib/moderation/useReportOptions'
import {isAndroid} from '#/platform/detection'
import {useAgent} from '#/state/session'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, native, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft} from '#/components/icons/Chevron'
import {PaperPlane_Stroke2_Corner0_Rounded as SendIcon} from '#/components/icons/PaperPlane'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {type ReportDialogProps} from './types'

export function SubmitView({
  params,
  labelers,
  selectedLabeler,
  selectedReportOption,
  goBack,
  onSubmitComplete,
}: ReportDialogProps & {
  labelers: AppBskyLabelerDefs.LabelerViewDetailed[]
  selectedLabeler: string
  selectedReportOption: ReportOption
  goBack: () => void
  onSubmitComplete: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const agent = useAgent()
  const [details, setDetails] = React.useState<string>('')
  const [submitting, setSubmitting] = React.useState<boolean>(false)
  const [selectedServices, setSelectedServices] = React.useState<string[]>([
    selectedLabeler,
  ])
  const [error, setError] = React.useState('')

  const submit = React.useCallback(async () => {
    setSubmitting(true)
    setError('')

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
    const results = await Promise.all(
      selectedServices.map(did => {
        return agent
          .createModerationReport(report, {
            encoding: 'application/json',
            headers: {
              'atproto-proxy': `${did}#atproto_labeler`,
            },
          })
          .then(
            _ => true,
            _ => false,
          )
      }),
    )

    setSubmitting(false)

    if (results.includes(true)) {
      Toast.show(_(msg`Thank you. Your report has been sent.`))
      onSubmitComplete()
    } else {
      setError(
        _(
          msg`There was an issue sending your report. Please check your internet connection.`,
        ),
      )
    }
  }, [
    _,
    params,
    details,
    selectedReportOption,
    selectedServices,
    onSubmitComplete,
    setError,
    agent,
  ])

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
          a.border,
          t.atoms.border_contrast_low,
        ]}>
        <View style={[a.flex_1, a.gap_xs]}>
          <Text style={[a.text_md, a.font_semi_bold]}>
            {selectedReportOption.title}
          </Text>
          <Text style={[a.leading_tight, {maxWidth: 400}]}>
            {selectedReportOption.description}
          </Text>
        </View>

        <Check size="md" style={[a.pr_sm, t.atoms.text_contrast_low]} />
      </View>

      <View style={[a.gap_md]}>
        <Text style={[t.atoms.text_contrast_medium]}>
          <Trans>Select the moderation service(s) to report to</Trans>
        </Text>

        <Toggle.Group
          label="Select mod services"
          values={selectedServices}
          onChange={setSelectedServices}>
          <View style={[a.flex_row, a.gap_md, a.flex_wrap]}>
            {labelers.map(labeler => {
              const title = getLabelingServiceTitle({
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
        {!selectedServices.length ||
          (error && (
            <Text
              style={[
                a.flex_1,
                a.italic,
                a.leading_snug,
                t.atoms.text_contrast_medium,
              ]}>
              {error ? (
                error
              ) : (
                <Trans>You must select at least one labeler for a report</Trans>
              )}
            </Text>
          ))}

        <Button
          testID="sendReportBtn"
          size="large"
          variant="solid"
          color="negative"
          label={_(msg`Send report`)}
          onPress={submit}
          disabled={!selectedServices.length}>
          <ButtonText>
            <Trans>Send report</Trans>
          </ButtonText>
          <ButtonIcon icon={submitting ? Loader : SendIcon} />
        </Button>
      </View>
      {/* Maybe fix this later -h */}
      {isAndroid ? <View style={{height: 300}} /> : null}
    </View>
  )
}

function LabelerToggle({title}: {title: string}) {
  const t = useTheme()
  const ctx = Toggle.useItemContext()

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_md,
        a.p_md,
        a.pr_lg,
        a.rounded_sm,
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
        ctx.selected && [t.atoms.bg_contrast_50],
      ]}>
      <Toggle.Checkbox />
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_lg,
          a.z_10,
        ]}>
        <Text
          emoji
          style={[
            native({marginTop: 2}),
            t.atoms.text_contrast_medium,
            ctx.selected && t.atoms.text,
          ]}>
          {title}
        </Text>
      </View>
    </View>
  )
}
