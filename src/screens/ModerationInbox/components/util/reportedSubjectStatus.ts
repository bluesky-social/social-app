import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {type tools} from '#/lexicons'

export function getReportedSubjectStatusLabels({
  accountStatus,
  subjectStatus,
}: Pick<
  tools.ozone.inbox.getReport.ReportView,
  'accountStatus' | 'subjectStatus'
>): MessageDescriptor[] {
  const labels: MessageDescriptor[] = []
  const accountStates = new Set([
    accountStatus?.enforcement,
    accountStatus?.hosting,
  ])
  if (accountStates.has('takendown')) labels.push(msg`Account taken down`)
  if (accountStates.has('suspended')) labels.push(msg`Account suspended`)

  if (accountStatus?.hosting === 'deleted') labels.push(msg`Account deleted`)
  else if (accountStatus?.hosting === 'deactivated')
    labels.push(msg`Account deactivated`)

  if (subjectStatus?.takendown)
    labels.push(msg`Content taken down by moderation`)
  if (subjectStatus?.deleted) labels.push(msg`Content deleted`)
  return labels
}
