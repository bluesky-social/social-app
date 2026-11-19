import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
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
    <View testID="moderationInboxReportedSubjectStatus">
      <Admonition.Outer type="info">
        <Admonition.Row>
          <Admonition.Icon />
          <Admonition.Content>
            <Text
              style={[a.text_sm, a.font_semi_bold, t.atoms.text_contrast_high]}>
              <Trans>Current status:</Trans>
            </Text>
            {labels.map(label => (
              <Text key={label.id} style={[a.text_md, a.font_semi_bold]}>
                {i18n._(label)}
              </Text>
            ))}
          </Admonition.Content>
        </Admonition.Row>
      </Admonition.Outer>
    </View>
  )
}
