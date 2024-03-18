import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AppBskyLabelerDefs} from '@atproto/api'

import {useReportOptions, ReportOption} from '#/lib/moderation/useReportOptions'
import {DMCA_LINK} from '#/components/ReportDialog/const'
import {Link} from '#/components/Link'
export {useDialogControl as useReportDialogControl} from '#/components/Dialog'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {
  Button,
  ButtonIcon,
  ButtonText,
  useButtonContext,
} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRight} from '#/components/icons/SquareArrowTopRight'

import {ReportDialogProps} from './types'

export function SelectReportOptionView({
  ...props
}: ReportDialogProps & {
  labelers: AppBskyLabelerDefs.LabelerViewDetailed[]
  onSelectReportOption: (reportOption: ReportOption) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const allReportOptions = useReportOptions()
  const reportOptions = allReportOptions[props.params.type]

  const i18n = React.useMemo(() => {
    let title = _(msg`Report this content`)
    let description = _(msg`Why should this content be reviewed?`)

    if (props.params.type === 'account') {
      title = _(msg`Report this user`)
      description = _(msg`Why should this user be reviewed?`)
    } else if (props.params.type === 'post') {
      title = _(msg`Report this post`)
      description = _(msg`Why should this post be reviewed?`)
    } else if (props.params.type === 'list') {
      title = _(msg`Report this list`)
      description = _(msg`Why should this list be reviewed?`)
    } else if (props.params.type === 'feedgen') {
      title = _(msg`Report this feed`)
      description = _(msg`Why should this feed be reviewed?`)
    }

    return {
      title,
      description,
    }
  }, [_, props.params.type])

  return (
    <View style={[a.gap_lg]}>
      <View style={[a.justify_center, a.gap_sm]}>
        <Text style={[a.text_2xl, a.font_bold]}>{i18n.title}</Text>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          {i18n.description}
        </Text>
      </View>

      <Divider />

      <View style={[a.gap_sm, {marginHorizontal: a.p_md.padding * -1}]}>
        {reportOptions.map(reportOption => {
          return (
            <Button
              key={reportOption.reason}
              label={_(msg`Create report for ${reportOption.title}`)}
              onPress={() => props.onSelectReportOption(reportOption)}>
              <ReportOptionButton
                title={reportOption.title}
                description={reportOption.description}
              />
            </Button>
          )
        })}

        {(props.params.type === 'post' || props.params.type === 'account') && (
          <View style={[a.pt_md, a.px_md]}>
            <View
              style={[
                a.flex_row,
                a.align_center,
                a.justify_between,
                a.gap_lg,
                a.p_md,
                a.pl_lg,
                a.rounded_md,
                t.atoms.bg_contrast_900,
              ]}>
              <Text
                style={[
                  a.flex_1,
                  t.atoms.text_inverted,
                  a.italic,
                  a.leading_snug,
                ]}>
                <Trans>Need to report a copyright violation?</Trans>
              </Text>
              <Link
                to={DMCA_LINK}
                label={_(msg`View details for reporting a copyright violation`)}
                size="small"
                variant="solid"
                color="secondary">
                <ButtonText>
                  <Trans>View details</Trans>
                </ButtonText>
                <ButtonIcon position="right" icon={SquareArrowTopRight} />
              </Link>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

function ReportOptionButton({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const t = useTheme()
  const {hovered, pressed} = useButtonContext()
  const interacted = hovered || pressed

  const styles = React.useMemo(() => {
    return {
      interacted: {
        backgroundColor: t.palette.contrast_50,
      },
    }
  }, [t])

  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.p_md,
        a.rounded_md,
        {paddingRight: 70},
        interacted && styles.interacted,
      ]}>
      <View style={[a.flex_1, a.gap_xs]}>
        <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
          {title}
        </Text>
        <Text style={[a.leading_tight, {maxWidth: 400}]}>{description}</Text>
      </View>

      <View
        style={[
          a.absolute,
          a.inset_0,
          a.justify_center,
          a.pr_md,
          {left: 'auto'},
        ]}>
        <ChevronRight
          size="md"
          fill={
            hovered ? t.palette.primary_500 : t.atoms.text_contrast_low.color
          }
        />
      </View>
    </View>
  )
}
