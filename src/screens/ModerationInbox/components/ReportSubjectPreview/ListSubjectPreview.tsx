import {type AtUri} from '@atproto/syntax'
import {moderateUserList} from '@bsky/sdk/moderation'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useListQuery} from '#/state/queries/list'
import {useSubjectPreviewProfile} from '#/screens/ModerationInbox/components/hooks/useSubjectPreviewProfile'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {app, type tools} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {PreviewContent} from './PreviewContent'

export function ListSubjectPreview({
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
  const query = useListQuery(uri.toString())
  const {
    opts,
    name,
    moderation: creatorModeration,
    query: creatorQuery,
  } = useSubjectPreviewProfile(uri.host)
  const view = query.data
  // A newer revision must not stand in for the reported list.
  const matches =
    view && 'cid' in report.subject && view.cid === report.subject.cid
  const record = bsky.matches(app.bsky.graph.list, report.record)
    ? report.record
    : undefined
  const moderation =
    view && opts ? moderateUserList(view, opts) : creatorModeration
  const available = !!matches && !!moderation
  const listName = available ? (record?.name ?? view?.name) : undefined
  const title = listName ? l`List “${sanitizeDisplayName(listName)}”` : l`List`
  const description =
    record?.description ?? (matches ? view.description : undefined)
  const count = matches ? view.listItemCount : undefined
  const createdAt = record?.createdAt
  const metadataText: string[] = []
  if (count !== undefined) {
    metadataText.push(
      l`${plural(count, {one: '# account', other: '# accounts'})}`,
    )
  }
  metadataText.push(l`By ${name}`)
  if (createdAt) {
    const date = i18n.date(new Date(createdAt), {dateStyle: 'medium'})
    metadataText.push(l`Created ${date}`)
  }
  let content: React.ReactNode
  if (!available) {
    content = (
      <Text style={[a.text_md]}>
        <Trans>List unavailable</Trans>
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
      testID="moderationInboxListPreview"
      title={title}
      loading={
        query.isPending || creatorQuery.isPending || (!!matches && !opts)
      }
      moderation={moderation?.ui('contentView')}
      metadataText={metadataText}
      to={
        available
          ? {screen: 'ProfileList', params: {name: uri.host, rkey: uri.rkey}}
          : undefined
      }
      openLabel={l`Open list`}>
      {content}
    </PreviewContent>
  )
}
