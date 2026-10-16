import {AtUri, isAtUriString} from '@atproto/syntax'
import {msg, plural} from '@lingui/core/macro'

import {type tools} from '#/lexicons'
import {getReportActionLabel} from './reportActionLabel'

/** Labels reflect explicit appeal outcomes and the current moderation state. */
export function getNoticeLabels(
  data: tools.ozone.inbox.getActionedSubject.$OutputBody,
) {
  const action = data.actions[0]
  const isAccount = 'did' in data.subject
  const isPost =
    'uri' in data.subject &&
    isAtUriString(data.subject.uri, {strict: false}) &&
    new AtUri(data.subject.uri).collection === 'app.bsky.feed.post'
  const isRestoredPost =
    isPost &&
    data.enforcement.state !== 'removed' &&
    data.actions.some(
      action => action.type === 'contentRemoved' && action.reversedAt,
    )
  const appealResolved =
    data.appeal?.state === 'resolved' &&
    (!data.appeal.resolvedAt ||
      !action ||
      Date.parse(data.appeal.resolvedAt) >= Date.parse(action.createdAt))
  let header =
    getReportActionLabel({
      status: '',
      lastActionTaken: action?.type,
    }) ?? msg`Moderation notice`
  let appealSummary = msg`We reviewed your appeal. The current status of your content or account is shown below.`

  if (data.appeal?.state === 'pending') {
    header = msg`Appeal under review`
  } else if (appealResolved) {
    switch (data.appeal?.outcome) {
      case 'approved':
        header = msg`Appeal approved`
        appealSummary = isRestoredPost
          ? msg`A moderator reviewed your appeal and reversed the original decision. Your post has been restored and is visible again.`
          : msg`A moderator reviewed your appeal and reversed the original decision.`
        break
      case 'denied':
        header = msg`Appeal denied`
        appealSummary = msg`We reviewed your appeal and are keeping our original decision in place.`
        break
      default:
        header = msg`Appeal resolved`
        break
    }
  } else if (action?.reversedAt) {
    header = isAccount
      ? msg`The action against your account was reversed`
      : msg`The action against your content was reversed`
  } else if (action?.type === 'accountSuspended' && action.expiresAt) {
    const hours = Math.max(
      0,
      Math.round(
        (Date.parse(action.expiresAt) - Date.parse(action.createdAt)) /
          3_600_000,
      ),
    )
    header = msg`Your account was temporarily suspended for ${plural(hours, {
      one: '# hour',
      other: '# hours',
    })}`
  } else if (
    action?.type === 'accountTakedown' ||
    action?.type === 'accountSuspended'
  ) {
    header = msg`Your account was suspended`
  } else if (action?.type === 'contentRemoved') {
    header = isPost ? msg`Your post was removed` : msg`Your content was removed`
  } else if (action?.type === 'labelApplied') {
    header = isAccount
      ? msg`A label was added to your account`
      : isPost
        ? msg`A label was added to your post`
        : msg`A label was added to your content`
  }

  const blockHeader = isAccount
    ? data.enforcement.state === 'suspended' ||
      data.enforcement.state === 'takendown'
      ? msg`Limited profile`
      : msg`Your account`
    : isPost
      ? data.enforcement.state === 'removed'
        ? msg`Removed post`
        : isRestoredPost
          ? msg`Restored post`
          : msg`Your post`
      : msg`Your content`
  const date =
    data.appeal?.state === 'pending'
      ? data.appeal.appealedAt
      : appealResolved
        ? data.appeal?.resolvedAt
        : (action?.reversedAt ?? action?.createdAt)

  return {header, blockHeader, date, appealResolved, appealSummary}
}
