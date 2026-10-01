import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {type tools} from '#/lexicons'

type ReportResolutionOutcome = NonNullable<
  tools.ozone.inbox.getReport.$OutputBody['resolution']
>['outcome']

export function getReportActionLabel({
  status,
  lastActionTaken,
  resolutionOutcome,
}: {
  status: string
  lastActionTaken?: string
  resolutionOutcome?: ReportResolutionOutcome
}): MessageDescriptor | undefined {
  if (resolutionOutcome === 'noAction') {
    return msg`Reviewed, no action taken`
  }

  if (lastActionTaken) {
    switch (lastActionTaken) {
      case 'contentRemoved':
        return msg`Content removed`
      case 'accountSuspended':
        return msg`Account suspended`
      case 'accountTakedown':
        return msg`Account taken down`
      case 'labelApplied':
        return msg`Label applied`
      case 'labelRemoved':
        return msg`Label removed`
      case 'communicationSent':
        return msg`Communication sent`
      case 'reportingRestricted':
        return msg`Reporting restricted`
      case 'credentialsRevoked':
        return msg`Credentials revoked`
      default:
        return msg`Action taken`
    }
  }

  if (resolutionOutcome === 'actionTaken') {
    return msg`Action taken`
  }

  if (status === 'pending') {
    return msg`Awaiting review`
  }

  if (status === 'resolved' || resolutionOutcome === 'other') {
    return msg`Reviewed, no action taken`
  }
}
