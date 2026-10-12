import {type AtUri} from '@atproto/syntax'
import {moderateFeedGenerator} from '@bsky/sdk/moderation'
import {Trans, useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useFeedSourceInfoQuery} from '#/state/queries/feed'
import {useSubjectPreviewProfile} from '#/screens/ModerationInbox/components/hooks/useSubjectPreviewProfile'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {app, type tools} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {PreviewContent} from './PreviewContent'

export function FeedSubjectPreview({
  report,
  uri,
}: {
  report: Pick<
    tools.ozone.inbox.getReport.$OutputBody['report'],
    'subject' | 'record'
  >
  uri: AtUri
}) {
  const {i18n, t: l} = useLingui()
  const query = useFeedSourceInfoQuery({uri: uri.toString()})
  const {
    opts,
    name,
    moderation: creatorModeration,
    query: creatorQuery,
  } = useSubjectPreviewProfile(uri.host)
  const view = query.data?.type === 'feed' ? query.data.view : undefined
  // A newer revision must not stand in for the reported feed.
  const matches =
    view && 'cid' in report.subject && view.cid === report.subject.cid
  const record = bsky.matches(app.bsky.feed.generator, report.record)
    ? report.record
    : undefined
  const moderation =
    view && opts ? moderateFeedGenerator(view, opts) : creatorModeration
  const available = !!matches && !!moderation
  const feedName = available
    ? (record?.displayName ?? view?.displayName)
    : undefined
  const title = feedName ? l`Feed “${sanitizeDisplayName(feedName)}”` : l`Feed`
  const description =
    record?.description ?? (matches ? view.description : undefined)
  const metadataText = [l`By ${name}`]
  if (record) {
    const createdAt = i18n.date(new Date(record.createdAt), {
      dateStyle: 'medium',
    })
    metadataText.push(l`Created ${createdAt}`)
  }
  let content: React.ReactNode
  if (!available) {
    content = (
      <Text style={[a.text_md]}>
        <Trans>Feed unavailable</Trans>
      </Text>
    )
  } else if (description) {
    content = (
      <Text emoji numberOfLines={3} style={[a.text_md]}>
        <Trans>Description: “{description}”</Trans>
      </Text>
    )
  }

  return (
    <PreviewContent
      testID="moderationInboxFeedPreview"
      title={title}
      loading={
        query.isPending || creatorQuery.isPending || (!!matches && !opts)
      }
      moderation={moderation?.ui('contentView')}
      metadataText={metadataText}
      to={
        available
          ? {screen: 'CustomFeed', params: {name: uri.host, rkey: uri.rkey}}
          : undefined
      }
      openLabel={l`Open feed`}>
      {content}
    </PreviewContent>
  )
}
