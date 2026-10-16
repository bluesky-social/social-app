import {
  type ActionedSubject,
  useActionedSubjectLabels,
} from './hooks/useActionedSubjectLabels'
import {ReportRow} from './ReportRow'

export function YourAccountRow({
  item,
  unread,
}: {
  item: ActionedSubject
  unread: boolean
}) {
  const labels = useActionedSubjectLabels(item)
  const action = item.latestAction
  const subject =
    'did' in item.subject && typeof item.subject.did === 'string'
      ? item.subject.did
      : 'uri' in item.subject && typeof item.subject.uri === 'string'
        ? item.subject.uri
        : undefined

  if (!action || !labels || !subject) return null

  const dateEnd = action.reversedAt ?? action.expiresAt

  return (
    <ReportRow
      subject={labels.subject}
      action={labels.summary}
      date={new Date(action.createdAt)}
      dateEnd={dateEnd ? new Date(dateEnd) : undefined}
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
