import {type AtUri} from '@atproto/syntax'
import {moderateStatus} from '@bsky/sdk/moderation'
import {Trans, useLingui} from '@lingui/react/macro'

import {useSubjectPreviewProfile} from '#/screens/ModerationInbox/components/hooks/useSubjectPreviewProfile'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {app, type tools} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {PreviewContent} from './PreviewContent'

export function StatusSubjectPreview({
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
  const {
    query,
    profile,
    name,
    opts,
    moderation: creatorModeration,
  } = useSubjectPreviewProfile(uri.host)
  const status = profile?.status
  const matches =
    status?.uri === uri.toString() &&
    'cid' in report.subject &&
    status.cid === report.subject.cid &&
    !status.isDisabled
  const moderation =
    profile && matches && opts
      ? moderateStatus(profile, opts)
      : creatorModeration
  const available = !!matches && !!moderation
  const record = bsky.matches(app.bsky.actor.status, report.record)
    ? report.record
    : undefined
  const metadataText = [l`Status by ${name}`]
  if (record) {
    const createdAt = i18n.date(new Date(record.createdAt), {
      dateStyle: 'medium',
    })
    metadataText.push(l`Set ${createdAt}`)
  }
  let title = l`Account status`
  if (available && record?.status === app.bsky.actor.status.live.value) {
    title = l`Live status`
    if (record.embed && bsky.matches(app.bsky.embed.external, record.embed)) {
      try {
        const url = new URL(record.embed.external.uri)
        if (url.protocol === 'https:' || url.protocol === 'http:') {
          title = l`Live link: “${url.hostname}”`
        }
      } catch {
        // Invalid embed URLs do not become navigation destinations.
      }
    }
  }

  return (
    <PreviewContent
      testID="moderationInboxStatusPreview"
      title={title}
      loading={query.isPending || (!!matches && !opts)}
      moderation={moderation?.ui('contentView')}
      metadataText={metadataText}>
      {!available || !record ? (
        <Text style={[a.text_md]}>
          <Trans>Status unavailable</Trans>
        </Text>
      ) : null}
    </PreviewContent>
  )
}
