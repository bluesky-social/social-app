import {AtUri, isAtUriString} from '@atproto/syntax'
import {Trans, useLingui} from '@lingui/react/macro'

import {webLinks} from '#/lib/constants'
import {atoms as a} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {type tools} from '#/lexicons'
import {ActionSummaryText} from './ActionSummaryText'
import {getReportActionLabel} from './util/reportActionLabel'

export function ReportActionSummary({
  report,
  resolution,
}: tools.ozone.inbox.getReport.$OutputBody) {
  const {i18n, t: l} = useLingui()
  const isPost =
    'uri' in report.subject &&
    typeof report.subject.uri === 'string' &&
    isAtUriString(report.subject.uri, {strict: false}) &&
    new AtUri(report.subject.uri).collection === 'app.bsky.feed.post'
  const noAction = resolution?.outcome === 'noAction'
  const restored =
    !noAction &&
    (resolution?.actionTaken === 'contentRestored' ||
      resolution?.actionTaken === 'accountRestored')
  const actionTaken =
    !noAction &&
    !restored &&
    (resolution?.outcome === 'actionTaken' || !!resolution?.actionTaken)
  const actionLabel = getReportActionLabel({
    status: report.status,
    lastActionTaken: resolution?.actionTaken,
    resolutionOutcome: resolution?.outcome,
  })
  const header = actionLabel ? i18n._(actionLabel) : undefined
  const date = new Date(
    resolution?.resolvedAt ??
      (report.status === 'resolved' ? report.updatedAt : report.createdAt),
  )

  if (!header) return null

  let description: React.ReactNode

  if (report.status === 'pending' && !resolution) {
    description = (
      <Trans>
        Thanks for your report. We’ll look into it and take action in accordance
        with our{' '}
        <InlineLinkText
          to={webLinks.community}
          label={l`Read our Community Guidelines`}
          style={[a.text_md]}>
          Community Guidelines
        </InlineLinkText>
        .
      </Trans>
    )
  } else if (restored && resolution?.actionTaken === 'accountRestored') {
    description = (
      <Trans>
        The account you reported has been restored after another review. You can
        mute or block it if you’d rather not see its content. Read our{' '}
        <InlineLinkText
          to={webLinks.community}
          label={l`Read our Community Guidelines`}
          style={[a.text_md]}>
          Community Guidelines
        </InlineLinkText>
        .
      </Trans>
    )
  } else if (restored) {
    description = (
      <Trans>
        The content you reported has been restored after another review. If
        you’d rather not see it, you can mute or block the account. Read our{' '}
        <InlineLinkText
          to={webLinks.community}
          label={l`Read our Community Guidelines`}
          style={[a.text_md]}>
          Community Guidelines
        </InlineLinkText>
        .
      </Trans>
    )
  } else if (isPost && noAction) {
    description = (
      <Trans>
        We reviewed your report and found that this doesn’t break our rules. You
        can mute or block the account if you’d rather not see the post. Read our{' '}
        <InlineLinkText
          to={webLinks.community}
          label={l`Read our Community Guidelines`}
          style={[a.text_md]}>
          Community Guidelines
        </InlineLinkText>
        .
      </Trans>
    )
  } else if (noAction) {
    description = (
      <Trans>
        We reviewed your report and found that this doesn’t break our rules.
        Read our{' '}
        <InlineLinkText
          to={webLinks.community}
          label={l`Read our Community Guidelines`}
          style={[a.text_md]}>
          Community Guidelines
        </InlineLinkText>
        .
      </Trans>
    )
  } else if (isPost && actionTaken) {
    description = (
      <Trans>
        Thanks for helping keep Bluesky safe. This post violated our{' '}
        <InlineLinkText
          to={webLinks.community}
          label={l`Read our Community Guidelines`}
          style={[a.text_md]}>
          Community Guidelines
        </InlineLinkText>
        .
      </Trans>
    )
  } else if (actionTaken) {
    description = (
      <Trans>
        Thanks for helping keep Bluesky safe. We reviewed your report and took
        action. Read our{' '}
        <InlineLinkText
          to={webLinks.community}
          label={l`Read our Community Guidelines`}
          style={[a.text_md]}>
          Community Guidelines
        </InlineLinkText>
        .
      </Trans>
    )
  } else {
    description = (
      <Trans>
        Your report has been resolved. Read our{' '}
        <InlineLinkText
          to={webLinks.community}
          label={l`Read our Community Guidelines`}
          style={[a.text_md]}>
          Community Guidelines
        </InlineLinkText>
        .
      </Trans>
    )
  }

  return (
    <ActionSummaryText header={header} date={date}>
      {description}
    </ActionSummaryText>
  )
}
