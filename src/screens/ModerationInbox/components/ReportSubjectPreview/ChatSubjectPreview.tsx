import {useLingui} from '@lingui/react/macro'

import {useReportSubjectLabel} from '#/screens/ModerationInbox/components/hooks/useReportSubjectLabel'
import {type tools} from '#/lexicons'
import {PreviewContent} from './PreviewContent'

export function ChatSubjectPreview({
  report,
}: {
  report: Pick<
    tools.ozone.inbox.getReport.$OutputBody['report'],
    'subject' | 'record'
  >
}) {
  const {t: l} = useLingui()
  const title = useReportSubjectLabel(report.subject)
  const conversation =
    'convoId' in report.subject && typeof report.subject.convoId === 'string'
      ? report.subject.convoId
      : undefined

  return (
    <PreviewContent
      testID="moderationInboxChatPreview"
      title={title}
      metadataText={[l`Message content is not included in this report.`]}
      to={
        conversation
          ? {screen: 'MessagesConversation', params: {conversation}}
          : undefined
      }
      openLabel={l`Open chat`}
    />
  )
}
