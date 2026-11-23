import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {type tools} from '#/lexicons'
import {getReportedSubjectStatusLabels} from './util/reportedSubjectStatus'

export function ReportedSubjectStatus({
  report,
}: {
  report: Pick<
    tools.ozone.inbox.getReport.ReportView,
    'accountStatus' | 'subjectStatus'
  >
}) {
  const t = useTheme()
  const {i18n} = useLingui()
  const labels = getReportedSubjectStatusLabels(report)
  if (!labels.length) return null

  return (
    <View testID="moderationInboxReportedSubjectStatus" style={[a.gap_2xs]}>
      <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
        <Trans>Current status:</Trans>
      </Text>
      {labels.map(label => (
        <Text key={label.id} style={[a.text_md]}>
          {i18n._(label)}
        </Text>
      ))}
    </View>
  )
}
