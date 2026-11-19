import {type AtUri, isValidDid} from '@atproto/syntax'
import {Trans, useLingui} from '@lingui/react/macro'

import {moderateExternalView} from '#/lib/moderation/moderateExternalView'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useSubjectPreviewProfile} from '#/screens/ModerationInbox/components/hooks/useSubjectPreviewProfile'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {com, type tools} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {getBskyRecordSnapshot} from './bskyRecordSnapshot'
import {PreviewContent} from './PreviewContent'

export function BskyRecordSnapshotPreview({
  report,
  uri,
  subjectLabel,
  liveLabels,
}: {
  report: Pick<
    tools.ozone.inbox.getReport.$OutputBody['report'],
    'subject' | 'record'
  >
  uri: AtUri
  subjectLabel: string
  liveLabels?: com.atproto.label.defs.Label[]
}) {
  const {i18n, t: l} = useLingui()
  const {query, profile, opts} = useSubjectPreviewProfile(uri.host)
  const snapshot = getBskyRecordSnapshot(uri.collection, report.record)
  const ref = bsky.matches(com.atproto.repo.strongRef, report.subject)
    ? report.subject
    : undefined
  const did = isValidDid(uri.host) ? uri.host : undefined
  if (!snapshot || !ref || !did) return null

  let title = subjectLabel
  if (snapshot.kind === 'feed')
    title = l`Feed “${sanitizeDisplayName(snapshot.name)}”`
  else if (snapshot.kind === 'list')
    title = l`List “${sanitizeDisplayName(snapshot.name)}”`
  else if (snapshot.kind === 'starterPack')
    title = l`Starter Pack “${sanitizeDisplayName(snapshot.name)}”`
  else if (snapshot.kind === 'liveStatus') title = l`Live status`

  const text = snapshot.kind === 'post' ? snapshot.text : ''
  const description = 'description' in snapshot ? snapshot.description : ''
  const moderation = opts
    ? moderateExternalView(
        {
          uri: ref.uri,
          title: snapshot.kind === 'post' ? text : title,
          description: description ?? '',
          associatedRefs: [ref],
          associatedProfiles: profile
            ? [{...profile, $type: 'app.bsky.actor.defs#profileViewBasic'}]
            : [],
          labels: [
            ...(liveLabels?.filter(
              label =>
                label.uri === ref.uri &&
                (!label.cid || label.cid === ref.cid) &&
                !label.neg,
            ) ?? []),
            ...(snapshot.labels?.map(({val}) => ({
              src: did,
              uri: ref.uri,
              val,
              cts: '1970-01-01T00:00:00.000Z' as const,
            })) ?? []),
          ],
        },
        opts,
      )
    : undefined
  if (snapshot.kind === 'post' && opts?.prefs.hiddenPosts?.includes(ref.uri)) {
    moderation?.addHidden(true)
  }
  const date = i18n.date(new Date(snapshot.createdAt), {dateStyle: 'medium'})
  const dateLabel =
    snapshot.kind === 'post'
      ? l`Posted ${date}`
      : snapshot.kind === 'liveStatus'
        ? l`Set ${date}`
        : l`Created ${date}`

  return (
    <PreviewContent
      testID="moderationInboxRecordSnapshotPreview"
      title={title}
      loading={query.isPending || !opts}
      moderation={moderation?.ui('contentView')}
      metadataText={[dateLabel]}>
      {text ? (
        <Text emoji numberOfLines={3} style={[a.text_md]}>
          <Trans>“{text}”</Trans>
        </Text>
      ) : description ? (
        <Text emoji numberOfLines={3} style={[a.text_md]}>
          <Trans>Description: “{description}”</Trans>
        </Text>
      ) : null}
    </PreviewContent>
  )
}
