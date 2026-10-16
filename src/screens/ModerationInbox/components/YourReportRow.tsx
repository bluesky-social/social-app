import {useLingui} from '@lingui/react/macro'

import * as Layout from '#/components/Layout'
import {type tools} from '#/lexicons'
import {useReportSubjectLabel} from './hooks/useReportSubjectLabel'
import {ReportRow} from './ReportRow'
import {getReportActionLabel} from './util/reportActionLabel'

type InboxReport = tools.ozone.inbox.listReports.$OutputBody['reports'][number]

export function YourReportRow({report}: {report: InboxReport}) {
  const {i18n} = useLingui()
  const subjectLabel = useReportSubjectLabel(report.subject)
  const actionLabel = getReportActionLabel({
    status: report.status,
    lastActionTaken: report.lastActionTaken,
  })

  return (
    <Layout.Center>
      <ReportRow
        subject={subjectLabel}
        action={actionLabel ? i18n._(actionLabel) : undefined}
        date={new Date(report.updatedAt)}
        to={{
          screen: 'ModerationInboxReportDetails',
          params: {moderationService: report.src, id: report.id.toString()},
        }}
        unread={!report.isRead}
      />
    </Layout.Center>
  )
}
