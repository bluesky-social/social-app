import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AppBskyLabelerDefs} from '@atproto/api'

export {useDialogControl as useReportDialogControl} from '#/components/Dialog'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {Button, useButtonContext} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'

import {ReportDialogProps} from './types'

export function SelectLabelerView({
  ...props
}: ReportDialogProps & {
  labelers: AppBskyLabelerDefs.LabelerViewDetailed[]
  onSelectLabeler: (v: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <View style={[a.gap_lg]}>
      <View style={[a.justify_center, a.gap_sm]}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>Select moderation service</Trans>
        </Text>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>Who do you want to send this report to?</Trans>
        </Text>
      </View>

      <Divider />

      <View style={[a.gap_sm, {marginHorizontal: a.p_md.padding * -1}]}>
        {props.labelers.map(labeler => {
          return (
            <Button
              key={labeler.creator.did}
              label={_(msg`Send report to ${labeler.creator.displayName}`)}
              onPress={() => props.onSelectLabeler(labeler.creator.did)}>
              <LabelerButton
                title={labeler.creator.displayName || labeler.creator.handle}
                description={labeler.creator.description || ''}
              />
            </Button>
          )
        })}
      </View>
    </View>
  )
}

function LabelerButton({
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
        <Text style={[a.leading_tight, {maxWidth: 400}]} numberOfLines={3}>
          {description}
        </Text>
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
