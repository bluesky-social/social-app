import React from 'react'
import {Pressable, View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ReportOption} from '#/lib/moderation/useReportOptions'
import {useMyLabelersQuery} from '#/state/queries/preferences'
export {useDialogControl as useReportDialogControl} from '#/components/Dialog'

import {AppBskyLabelerDefs} from '@atproto/api'

import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useDelayedLoading} from '#/components/hooks/useDelayedLoading'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {SelectLabelerView} from './SelectLabelerView'
import {SelectReportOptionView} from './SelectReportOptionView'
import {SubmitView} from './SubmitView'
import {ReportDialogProps} from './types'

export function ReportDialog(props: ReportDialogProps) {
  return (
    <Dialog.Outer control={props.control}>
      <Dialog.Handle />
      <ReportDialogInner {...props} />
    </Dialog.Outer>
  )
}

function ReportDialogInner(props: ReportDialogProps) {
  const {_} = useLingui()
  const {
    isLoading: isLabelerLoading,
    data: labelers,
    error,
  } = useMyLabelersQuery({excludeNonConfigurableLabelers: true})
  const isLoading = useDelayedLoading(500, isLabelerLoading)

  const ref = React.useRef<ScrollView>(null)

  return (
    <Dialog.ScrollableInner label={_(msg`Report dialog`)} ref={ref}>
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
