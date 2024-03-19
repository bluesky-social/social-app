import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AppBskyLabelerDefs} from '@atproto/api'

export {useDialogControl as useReportDialogControl} from '#/components/Dialog'
import {getLabelingServiceTitle} from '#/lib/moderation'

import {atoms as a, useTheme, useBreakpoints} from '#/alf'
import {Text} from '#/components/Typography'
import {Button, useButtonContext} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as LabelingServiceCard from '#/components/LabelingServiceCard'

import {ReportDialogProps} from './types'

export function SelectLabelerView({
  ...props
}: ReportDialogProps & {
  labelers: AppBskyLabelerDefs.LabelerViewDetailed[]
  onSelectLabeler: (v: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()

  return (
    <View style={[a.gap_lg]}>
      <View style={[a.justify_center, gtMobile ? a.gap_sm : a.gap_xs]}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>Select moderator</Trans>
        </Text>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>To whom would you like to send this report?</Trans>
        </Text>
      </View>

      <Divider />

      <View style={[a.gap_xs, {marginHorizontal: a.p_md.padding * -1}]}>
        {props.labelers.map(labeler => {
          return (
            <Button
              key={labeler.creator.did}
              label={_(msg`Send report to ${labeler.creator.displayName}`)}
              onPress={() => props.onSelectLabeler(labeler.creator.did)}>
              <LabelerButton labeler={labeler} />
            </Button>
          )
        })}
      </View>
    </View>
  )
}

function LabelerButton({
  labeler,
}: {
  labeler: AppBskyLabelerDefs.LabelerViewDetailed
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
    <LabelingServiceCard.Outer
      style={[a.p_md, a.rounded_sm, interacted && styles.interacted]}>
      <LabelingServiceCard.Avatar avatar={labeler.creator.avatar} />
      <LabelingServiceCard.Content>
        <LabelingServiceCard.Title
          value={getLabelingServiceTitle({
            displayName: labeler.creator.displayName,
            handle: labeler.creator.handle,
          })}
        />
        <Text
          style={[t.atoms.text_contrast_medium, a.text_sm, a.font_semibold]}>
          @{labeler.creator.handle}
        </Text>
      </LabelingServiceCard.Content>
    </LabelingServiceCard.Outer>
  )
}
