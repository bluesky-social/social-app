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

  if (!action || !labels) return null

  const dateEnd = action.reversedAt ?? action.expiresAt

  return (
    <ReportRow
      subject={labels.subject}
      action={labels.summary}
      date={new Date(action.createdAt)}
      dateEnd={dateEnd ? new Date(dateEnd) : undefined}
      to="/moderation/inbox/notice/details"
      unread={unread}
    />
  )
}
