import {View} from 'react-native'
import {AtUri, isAtUriString} from '@atproto/syntax'
import {moderatePost, moderateProfile} from '@bsky/sdk/moderation'
import {Trans, useLingui} from '@lingui/react/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePostQuery} from '#/state/queries/post'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {ButtonText} from '#/components/Button'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {ContentHider} from '#/components/moderation/ContentHider'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {Text} from '#/components/Typography'
import {app, type tools} from '#/lexicons'
import * as bsky from '#/types/bsky'

type Report = Pick<
  tools.ozone.inbox.getReport.$OutputBody['report'],
  'subject' | 'record'
>

export function PostSubjectPreview({
  report,
  uri,
  subjectLabel,
  allowOwnRecordSnapshot = false,
}: {
  report: Report
  uri: AtUri
  subjectLabel: string
  allowOwnRecordSnapshot?: boolean
}) {
  const t = useTheme()
  const {i18n, t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const {currentAccount, hasSession} = useSession()
  const postQuery = usePostQuery(uri.toString())
  // Do not present an edited post as the content that was reported.
  const post =
    postQuery.data &&
    'cid' in report.subject &&
    report.subject.cid === postQuery.data.cid
      ? postQuery.data
      : undefined
  const record = bsky.matches(app.bsky.feed.post, report.record)
    ? report.record
    : post && bsky.matches(app.bsky.feed.post, post.record)
      ? post.record
      : undefined
  /*
   * Ozone can return the owner's removed record even when appview cannot.
   * Report previews still require a live, moderated post with the same CID.
   */
  const canUseSnapshot =
    allowOwnRecordSnapshot &&
    hasSession &&
    uri.host === currentAccount?.did &&
    bsky.matches(app.bsky.feed.post, report.record)
  const parentUri =
    record?.reply && isAtUriString(record.reply.parent.uri, {strict: false})
      ? new AtUri(record.reply.parent.uri)
      : undefined
  const {data: parentProfile} = useProfileQuery({did: parentUri?.host})
  const parentName =
    parentProfile && moderationOpts
      ? createSanitizedDisplayName(
          parentProfile,
          false,
          moderateProfile(parentProfile, moderationOpts).ui('displayName'),
        )
      : undefined
  const moderation =
    post && moderationOpts ? moderatePost(post, moderationOpts) : undefined
  const title =
    post && moderation && record?.reply
      ? parentName
        ? l`Reply to ${parentName}`
        : l`Reply`
      : subjectLabel
  const isLoading = postQuery.isPending || (!!post && !moderationOpts)
  const text = record?.text ? (
    <Text emoji numberOfLines={2} style={[a.text_md]}>
      <Trans>“{record.text}”</Trans>
    </Text>
  ) : null

  return (
    <View testID="moderationInboxPostPreview" style={[a.gap_sm]}>
      <Text emoji style={[a.text_md, a.font_semi_bold]}>
        {title}
      </Text>
      {isLoading ? (
        <Loader size="md" />
      ) : record && ((post && moderation) || canUseSnapshot) ? (
        <>
          {post && moderation ? (
            <ContentHider modui={moderation.ui('contentView')}>
              <PostAlerts
                post={post}
                modui={moderation.ui('contentView')}
                style={[a.pb_xs]}
              />
              {text}
            </ContentHider>
          ) : (
            text
          )}
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            <Trans>
              Posted{' '}
              {i18n.date(new Date(record.createdAt), {dateStyle: 'medium'})}
            </Trans>
          </Text>
          {post && moderation ? (
            <View style={[a.align_start]}>
              <Link
                testID="moderationInboxOpenPost"
                to={{
                  screen: 'PostThread',
                  params: {name: uri.host, rkey: uri.rkey},
                }}
                label={l`Open post`}
                size="tiny"
                color="secondary">
                <ButtonText>
                  <Trans>Open post</Trans>
                </ButtonText>
              </Link>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Text style={[a.text_md]}>
            <Trans>Post unavailable</Trans>
          </Text>
          {record ? (
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              <Trans>
                Posted{' '}
                {i18n.date(new Date(record.createdAt), {dateStyle: 'medium'})}
              </Trans>
            </Text>
          ) : null}
        </>
      )}
    </View>
  )
}
