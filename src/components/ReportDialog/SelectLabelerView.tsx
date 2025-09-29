import {View} from 'react-native'
import {type AppBskyLabelerDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {getLabelingServiceTitle} from '#/lib/moderation'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, useButtonContext} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as LabelingServiceCard from '#/components/LabelingServiceCard'
import {Text} from '#/components/Typography'
import {type ReportDialogProps} from './types'

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
        <Text style={[a.text_2xl, a.font_semi_bold]}>
          <Trans>Select moderator</Trans>
        </Text>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>To whom would you like to send this report?</Trans>
        </Text>
      </View>

      <Divider />

      <View style={[a.gap_sm]}>
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

  return (
    <LabelingServiceCard.Outer
      style={[
        a.p_md,
        a.rounded_sm,
        t.atoms.bg_contrast_25,
        interacted && t.atoms.bg_contrast_50,
      ]}>
      <LabelingServiceCard.Avatar avatar={labeler.creator.avatar} />
      <LabelingServiceCard.Content>
        <LabelingServiceCard.Title
          value={getLabelingServiceTitle({
            displayName: labeler.creator.displayName,
            handle: labeler.creator.handle,
          })}
        />
        <Text
          style={[t.atoms.text_contrast_medium, a.text_sm, a.font_semi_bold]}>
          @{labeler.creator.handle}
        </Text>
      </LabelingServiceCard.Content>
    </LabelingServiceCard.Outer>
  )
}
