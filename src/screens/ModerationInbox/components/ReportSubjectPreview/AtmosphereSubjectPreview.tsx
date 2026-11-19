import {type AtUri, isValidDid} from '@atproto/syntax'
import {Trans} from '@lingui/react/macro'

import {moderateExternalView} from '#/lib/moderation/moderateExternalView'
import {useSubjectPreviewProfile} from '#/screens/ModerationInbox/components/hooks/useSubjectPreviewProfile'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {com, type tools} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {getAtmosphereRecord} from './atmosphereRecord'
import {PreviewContent} from './PreviewContent'

export function AtmosphereSubjectPreview({
  report,
  uri,
  subjectLabel,
}: {
  report: Pick<
    tools.ozone.inbox.getReport.$OutputBody['report'],
    'subject' | 'record'
  >
  uri: AtUri
  subjectLabel: string
}) {
  const {query, profile, opts} = useSubjectPreviewProfile(uri.host)
  const record = getAtmosphereRecord(uri.collection, report.record)
  const did = isValidDid(uri.host) ? uri.host : undefined
  const ref = bsky.matches(com.atproto.repo.strongRef, report.subject)
    ? report.subject
    : undefined
  const moderation =
    record && ref && did && opts
      ? moderateExternalView(
          {
            uri: ref.uri,
            title: record.title,
            description: record.description ?? '',
            associatedRefs: [ref],
            associatedProfiles: profile
              ? [{...profile, $type: 'app.bsky.actor.defs#profileViewBasic'}]
              : [],
            labels: record.labels?.map(({val}) => ({
              src: did,
              uri: ref.uri,
              val,
              // Self-labels have no creation timestamp in the raw record.
              cts: '1970-01-01T00:00:00.000Z',
            })),
          },
          opts,
        )
      : undefined
  const available = !!record && !!ref && !!did && !!opts

  return (
    <PreviewContent
      testID="moderationInboxAtmospherePreview"
      title={subjectLabel}
      loading={!!record && (query.isPending || !opts)}
      moderation={moderation?.ui('contentView')}>
      {available ? (
        <>
          <Text emoji numberOfLines={3} style={[a.text_md, a.font_semi_bold]}>
            {record.title}
          </Text>
          {record.description ? (
            <Text emoji numberOfLines={3} style={[a.text_md]}>
              <Trans>Description: “{record.description}”</Trans>
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={[a.text_md]}>
          <Trans>Content unavailable</Trans>
        </Text>
      )}
    </PreviewContent>
  )
}
