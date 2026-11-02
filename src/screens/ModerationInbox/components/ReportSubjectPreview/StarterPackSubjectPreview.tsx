import {type AtUri} from '@atproto/syntax'
import {ModerationDecision} from '@bsky/sdk/moderation'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useStarterPackQuery} from '#/state/queries/starter-packs'
import {useSubjectPreviewProfile} from '#/screens/ModerationInbox/components/hooks/useSubjectPreviewProfile'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {app, type tools} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {PreviewContent} from './PreviewContent'

export function StarterPackSubjectPreview({
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
  const query = useStarterPackQuery({uri: uri.toString()})
  const {
    opts: moderationOpts,
    name: authorName,
    moderation: creatorModeration,
    query: creatorQuery,
  } = useSubjectPreviewProfile(uri.host)
  // Keep the preview tied to the reported record, not a later revision.
  const starterPack =
    query.data &&
    'cid' in report.subject &&
    report.subject.cid === query.data.cid
      ? query.data
      : undefined
  const record = bsky.matches(app.bsky.graph.starterpack, report.record)
    ? report.record
    : starterPack &&
        bsky.matches(app.bsky.graph.starterpack, starterPack.record)
      ? starterPack.record
      : undefined
  const contentModeration = new ModerationDecision()
  contentModeration.setDid(uri.host)
  contentModeration.setIsMe(uri.host === moderationOpts?.userDid)
  if (starterPack && moderationOpts) {
    for (const label of starterPack.labels ?? []) {
      contentModeration.addLabel('content', label, moderationOpts)
    }
  }
  const moderation = ModerationDecision.merge(
    contentModeration,
    creatorModeration,
  )
  const available = !!starterPack && !!record && !!moderationOpts
  const name = available ? sanitizeDisplayName(record.name) : undefined
  const title = name ? l`Starter Pack “${name}”` : l`Starter Pack`
  const accountCount = starterPack?.list?.listItemCount ?? 0
  const feedCount = record?.feeds?.length ?? 0
  const isLoading =
    query.isPending ||
    creatorQuery.isPending ||
    (!!starterPack && !moderationOpts)
  const metadataText: string[] = []
  if (record) {
    if (accountCount > 0 && feedCount > 0) {
      metadataText.push(
        l`${plural(accountCount, {one: '# account', other: '# accounts'})}, ${plural(feedCount, {one: '# feed', other: '# feeds'})}`,
      )
    } else if (accountCount > 0) {
      metadataText.push(
        l`${plural(accountCount, {one: '# account', other: '# accounts'})}`,
      )
    } else if (feedCount > 0) {
      metadataText.push(
        l`${plural(feedCount, {one: '# feed', other: '# feeds'})}`,
      )
    }
  }
  if (authorName) {
    metadataText.push(l`By ${authorName}`)
  }
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
        <Trans>Starter pack unavailable</Trans>
      </Text>
    )
  } else if (record?.description) {
    content = (
      <Text emoji numberOfLines={3} style={[a.text_md]}>
        <Trans>Description: “{record.description}”</Trans>
      </Text>
    )
  }

  return (
    <PreviewContent
      testID="moderationInboxStarterPackPreview"
      title={title}
      loading={isLoading}
      moderation={moderation.ui('contentView')}
      metadataText={metadataText}
      to={
        available
          ? {screen: 'StarterPack', params: {name: uri.host, rkey: uri.rkey}}
          : undefined
      }
      openLabel={l`Open starter pack`}
      openTestID="moderationInboxOpenStarterPack">
      {content}
    </PreviewContent>
  )
}
