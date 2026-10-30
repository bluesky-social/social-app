import {AtUri, isAtUriString} from '@atproto/syntax'
import {moderateProfile} from '@bsky/sdk/moderation'
import {useLingui} from '@lingui/react/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery} from '#/state/queries/profile'
import {useStarterPackQuery} from '#/state/queries/starter-packs'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  getReportSubjectLabel,
  type ReportSubject,
} from '../util/reportSubjectLabel'

export function useReportSubjectLabel(subject: ReportSubject) {
  const {i18n} = useLingui()
  const moderationOpts = useModerationOpts()
  const uri =
    'uri' in subject &&
    typeof subject.uri === 'string' &&
    isAtUriString(subject.uri, {strict: false})
      ? new AtUri(subject.uri)
      : undefined
  const subjectDid =
    'did' in subject && typeof subject.did === 'string'
      ? subject.did
      : undefined
  const collection = uri?.collection
  const isStarterPack = collection === 'app.bsky.graph.starterpack'
  const {data: starterPack} = useStarterPackQuery({
    uri: isStarterPack ? uri?.toString() : undefined,
  })
  const fetchedStarterPackName =
    starterPack &&
    moderationOpts &&
    'cid' in subject &&
    subject.cid === starterPack.cid &&
    bsky.matches(app.bsky.graph.starterpack, starterPack.record)
      ? sanitizeDisplayName(starterPack.record.name)
      : undefined
  const profileDid =
    subjectDid ??
    (uri && collection !== 'app.bsky.graph.starterpack' ? uri.host : undefined)
  const {data: profile} = useProfileQuery({did: profileDid})
  const moderation =
    profile && moderationOpts
      ? moderateProfile(profile, moderationOpts)
      : undefined
  const authorName =
    profile && moderation
      ? createSanitizedDisplayName(profile, false, moderation.ui('displayName'))
      : undefined

  return i18n._(
    getReportSubjectLabel(subject, {
      authorName,
      starterPackName: fetchedStarterPackName,
    }),
  )
}
