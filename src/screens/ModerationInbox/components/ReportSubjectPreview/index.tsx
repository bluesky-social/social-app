import {View} from 'react-native'
import {AtUri, isAtUriString} from '@atproto/syntax'
import {Trans, useLingui} from '@lingui/react/macro'

import {useReportSubjectLabel} from '#/screens/ModerationInbox/components/hooks/useReportSubjectLabel'
import {atoms as a, useTheme} from '#/alf'
import {ButtonText} from '#/components/Button'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type tools} from '#/lexicons'
import {AccountSubjectPreview} from './AccountSubjectPreview'
import {ChatSubjectPreview} from './ChatSubjectPreview'
import {FeedSubjectPreview} from './FeedSubjectPreview'
import {ListSubjectPreview} from './ListSubjectPreview'
import {PostSubjectPreview} from './PostSubjectPreview'
import {StarterPackSubjectPreview} from './StarterPackSubjectPreview'
import {StatusSubjectPreview} from './StatusSubjectPreview'

type Report = Pick<
  tools.ozone.inbox.getReport.$OutputBody['report'],
  'subject' | 'record'
>

export function ReportSubjectPreview({
  report,
  allowOwnRecordSnapshot = false,
}: {
  report: Report
  allowOwnRecordSnapshot?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const subjectLabel = useReportSubjectLabel(report.subject)
  const uri =
    'uri' in report.subject &&
    typeof report.subject.uri === 'string' &&
    isAtUriString(report.subject.uri, {strict: false})
      ? new AtUri(report.subject.uri)
      : undefined
  const to = getSubjectLink(report.subject)
  const openLabel = 'convoId' in report.subject ? l`Open chat` : l`Open content`
  let preview: React.ReactNode

  if ('convoId' in report.subject) {
    preview = <ChatSubjectPreview report={report} />
  } else if (
    !uri &&
    'did' in report.subject &&
    typeof report.subject.did === 'string'
  ) {
    preview = <AccountSubjectPreview did={report.subject.did} />
  } else {
    switch (uri?.collection) {
      case 'app.bsky.feed.post':
        preview = (
          <PostSubjectPreview
            report={report}
            uri={uri}
            subjectLabel={subjectLabel}
            allowOwnRecordSnapshot={allowOwnRecordSnapshot}
          />
        )
        break
      case 'app.bsky.graph.starterpack':
        preview = <StarterPackSubjectPreview report={report} uri={uri} />
        break
      case 'app.bsky.feed.generator':
        preview = <FeedSubjectPreview report={report} uri={uri} />
        break
      case 'app.bsky.graph.list':
        preview = <ListSubjectPreview report={report} uri={uri} />
        break
      case 'app.bsky.actor.status':
        preview = <StatusSubjectPreview report={report} uri={uri} />
        break
      default:
        preview = (
          <>
            <Text emoji style={[a.text_md, a.font_semi_bold]}>
              {subjectLabel}
            </Text>
            <Text style={[a.text_md]}>
              <Trans>Content unavailable</Trans>
            </Text>
            {to ? (
              <View style={[a.align_start]}>
                <Link
                  testID="moderationInboxOpenContent"
                  to={to}
                  label={openLabel}
                  size="tiny"
                  color="secondary">
                  <ButtonText>{openLabel}</ButtonText>
                </Link>
              </View>
            ) : null}
          </>
        )
        break
    }
  }

  return (
    <View
      style={[
        a.p_lg,
        a.gap_sm,
        a.rounded_md,
        a.border,
        t.atoms.bg,
        t.atoms.border_contrast_low,
      ]}>
      {preview}
    </View>
  )
}

function getSubjectLink(
  subject: Report['subject'],
): React.ComponentProps<typeof Link>['to'] | undefined {
  if ('convoId' in subject && typeof subject.convoId === 'string') {
    return subject.convoId
      ? {
          screen: 'MessagesConversation',
          params: {conversation: subject.convoId},
        }
      : undefined
  }
  if ('did' in subject && typeof subject.did === 'string') {
    return {screen: 'Profile', params: {name: subject.did}}
  }
  if (
    'uri' in subject &&
    typeof subject.uri === 'string' &&
    isAtUriString(subject.uri, {strict: false})
  ) {
    const uri = new AtUri(subject.uri)
    const name = uri.host
    const rkey = uri.rkey
    switch (uri.collection) {
      case 'app.bsky.feed.post':
        return {screen: 'PostThread', params: {name, rkey}}
      case 'app.bsky.graph.list':
        return {screen: 'ProfileList', params: {name, rkey}}
      case 'app.bsky.feed.generator':
        return {screen: 'CustomFeed', params: {name, rkey}}
      case 'app.bsky.graph.starterpack':
        return {screen: 'StarterPack', params: {name, rkey}}
      case 'app.bsky.actor.status':
        return {screen: 'Profile', params: {name}}
    }
  }
}
