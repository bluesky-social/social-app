import React from 'react'
import {View, Linking, Pressable} from 'react-native'
import {AppBskyLabelerDefs} from '@atproto/api'

import {useMyLabelers} from '#/state/queries/preferences'
import {ReportOption} from '#/lib/moderation/useReportOptions'
import {DMCA_LINK} from '#/components/ReportDialog/const'
export {useDialogControl as useReportDialogControl} from '#/components/Dialog'

import {atoms as a} from '#/alf'
import {Loader} from '#/components/Loader'
import * as Dialog from '#/components/Dialog'

import {ReportDialogProps} from './types'
import {SelectReportOptionView} from './SelectReportOptionView'
import {SubmitView} from './SubmitView'

export function ReportDialogLoaded({
  ...props
}: ReportDialogProps & {
  labelers: AppBskyLabelerDefs.LabelerViewDetailed[]
}) {
  const control = Dialog.useDialogControl()
  const [selectedReportOption, setSelectedReportOption] = React.useState<
    ReportOption | undefined
  >()

  const onSelectReportOption = React.useCallback(
    (reportOption: ReportOption) => {
      if (reportOption.reason === 'copyright') {
        Linking.openURL(DMCA_LINK)
      } else {
        setSelectedReportOption(reportOption)
      }
    },
    [setSelectedReportOption],
  )

  return (
    <>
      {selectedReportOption ? (
        <SubmitView
          {...props}
          selectedReportOption={selectedReportOption}
          goBack={() => setSelectedReportOption(undefined)}
          onSubmitComplete={control.close}
        />
      ) : (
        <SelectReportOptionView
          {...props}
          onSelectReportOption={onSelectReportOption}
        />
      )}
    </>
  )
}

function ReportDialogInner(props: ReportDialogProps) {
  const {isLoading, data: labelers, error} = useMyLabelers()

  const [fakeLoading, setFakeLoading] = React.useState(isLoading)

  React.useEffect(() => {
    // on initial load, show a loading spinner for a hot sec to prevent flash
    if (fakeLoading) setTimeout(() => setFakeLoading(false), 500)
  }, [fakeLoading])

  return (
    <Dialog.ScrollableInner label="Report Dialog">
      {fakeLoading ? (
        <View style={[a.align_center, {height: 100}]}>
          <Loader size="xl" />
          {/* Here to capture focus for a hot sec to prevent flash */}
          <Pressable accessible={false} />
        </View>
      ) : error || !labelers ? null : ( // TODO
        <ReportDialogLoaded {...props} labelers={labelers} />
      )}
    </Dialog.ScrollableInner>
  )
}

export function ReportDialog(props: ReportDialogProps) {
  return (
    <Dialog.Outer control={props.control}>
      <Dialog.Handle />

      <ReportDialogInner {...props} />
    </Dialog.Outer>
  )
}
