import React from 'react'
import {View, Pressable} from 'react-native'
import {Trans} from '@lingui/macro'

import {useMyLabelersQuery} from '#/state/queries/preferences'
import {ReportOption} from '#/lib/moderation/useReportOptions'
export {useDialogControl as useReportDialogControl} from '#/components/Dialog'

import {atoms as a} from '#/alf'
import {Loader} from '#/components/Loader'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

import {ReportDialogProps} from './types'
import {SelectLabelerView} from './SelectLabelerView'
import {SelectReportOptionView} from './SelectReportOptionView'
import {SubmitView} from './SubmitView'
import {useDelayedLoading} from '#/components/hooks/useDelayedLoading'
import {AppBskyLabelerDefs} from '@atproto/api'

export function ReportDialog(props: ReportDialogProps) {
  return (
    <Dialog.Outer control={props.control}>
      <Dialog.Handle />

      <ReportDialogInner {...props} />
    </Dialog.Outer>
  )
}

function ReportDialogInner(props: ReportDialogProps) {
  const {
    isLoading: isLabelerLoading,
    data: labelers,
    error,
  } = useMyLabelersQuery()
  const isLoading = useDelayedLoading(500, isLabelerLoading)

  return (
    <Dialog.ScrollableInner label="Report Dialog">
      {isLoading ? (
        <View style={[a.align_center, {height: 100}]}>
          <Loader size="xl" />
          {/* Here to capture focus for a hot sec to prevent flash */}
          <Pressable accessible={false} />
        </View>
      ) : error || !labelers ? (
        <View>
          <Text style={[a.text_md]}>
            <Trans>Something went wrong, please try again.</Trans>
          </Text>
        </View>
      ) : (
        <ReportDialogLoaded labelers={labelers} {...props} />
      )}

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function ReportDialogLoaded(
  props: ReportDialogProps & {
    labelers: AppBskyLabelerDefs.LabelerViewDetailed[]
  },
) {
  const [selectedLabeler, setSelectedLabeler] = React.useState<
    string | undefined
  >(props.labelers.length === 1 ? props.labelers[0].creator.did : undefined)
  const [selectedReportOption, setSelectedReportOption] = React.useState<
    ReportOption | undefined
  >()

  if (selectedReportOption && selectedLabeler) {
    return (
      <SubmitView
        {...props}
        selectedLabeler={selectedLabeler}
        selectedReportOption={selectedReportOption}
        goBack={() => setSelectedReportOption(undefined)}
        onSubmitComplete={() => props.control.close()}
      />
    )
  }
  if (selectedLabeler) {
    return (
      <SelectReportOptionView
        {...props}
        goBack={() => setSelectedLabeler(undefined)}
        onSelectReportOption={setSelectedReportOption}
      />
    )
  }
  return <SelectLabelerView {...props} onSelectLabeler={setSelectedLabeler} />
}
