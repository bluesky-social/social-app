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
import {SelectReportOptionView} from './SelectReportOptionView'
import {SubmitView} from './SubmitView'
import {useDelayedLoading} from '#/components/hooks/useDelayedLoading'

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
  const [selectedReportOption, setSelectedReportOption] = React.useState<
    ReportOption | undefined
  >()

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
      ) : selectedReportOption ? (
        <SubmitView
          {...props}
          labelers={labelers}
          selectedReportOption={selectedReportOption}
          goBack={() => setSelectedReportOption(undefined)}
          onSubmitComplete={() => props.control.close()}
        />
      ) : (
        <SelectReportOptionView
          {...props}
          labelers={labelers}
          onSelectReportOption={setSelectedReportOption}
        />
      )}

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
