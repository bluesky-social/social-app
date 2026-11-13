import {useLingui} from '@lingui/react/macro'

import {
  type ActionedSubject,
  useActionedSubjectLabels,
} from './hooks/useActionedSubjectLabels'
import {ReportRow} from './ReportRow'
import {isAppealDecision} from './util/accountActions'

export function YourAccountRow({
  item,
  unread,
}: {
  item: ActionedSubject
  unread: boolean
}) {
  const {t: l} = useLingui()
  const action = item.latestAction
  const labels = useActionedSubjectLabels(item)
  const isAccount = 'did' in item.subject
  const status =
    isAccount && item.enforcement.state === 'takendown'
      ? l`Your account is suspended`
      : isAccount && item.enforcement.state === 'suspended'
        ? l`Your account is temporarily suspended`
        : undefined
  const newerAction =
    item.appeal?.state === 'resolved' &&
    item.appeal.resolvedAt &&
    action &&
    Date.parse(action.createdAt) > Date.parse(item.appeal.resolvedAt)
  const appealStatus = isAccount
    ? item.appeal?.state === 'pending'
      ? l`Appeal under review`
      : item.appeal?.state === 'resolved' &&
          (!newerAction || !action || !isAppealDecision(action))
        ? newerAction
          ? item.appeal.outcome === 'approved'
            ? l`Previous appeal approved`
            : item.appeal.outcome === 'denied'
              ? l`Previous appeal denied`
              : l`Previous appeal resolved`
          : item.appeal.outcome === 'approved'
            ? l`Appeal approved`
            : item.appeal.outcome === 'denied'
              ? l`Appeal denied`
              : l`Appeal resolved`
        : undefined
    : undefined
  const subject =
    'did' in item.subject && typeof item.subject.did === 'string'
      ? item.subject.did
      : 'uri' in item.subject && typeof item.subject.uri === 'string'
        ? item.subject.uri
        : undefined

  if (!subject || (!status && (!action || !labels))) return null

  const dateEnd = status ? undefined : (action?.reversedAt ?? action?.expiresAt)

  return (
    <ReportRow
      subject={status ?? labels!.subject}
      action={appealStatus ?? (status ? undefined : labels?.summary)}
      date={new Date(status ? item.updatedAt : action!.createdAt)}
      dateEnd={dateEnd ? new Date(dateEnd) : undefined}
      dateLabel={status ? l`Updated` : undefined}
      to={{
        screen: 'ModerationInboxNoticeDetails',
        params: {
          moderationService: item.src,
          subject,
        },
      }}
      unread={unread}
    />
  )
}
