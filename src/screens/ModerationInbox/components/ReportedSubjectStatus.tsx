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
    <Text
      testID="moderationInboxReportedSubjectStatus"
      style={[a.text_sm, t.atoms.text_contrast_medium]}>
      <Trans>Current status:</Trans>{' '}
      {labels.map((label, index) => (
        <Text
          key={label.id}
          style={[a.font_semi_bold, t.atoms.text_contrast_high]}>
          {index > 0 ? ' · ' : ''}
          {i18n._(label)}
        </Text>
      ))}
    </Text>
  )
}
