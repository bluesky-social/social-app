import {AtUri} from '@atproto/syntax'
import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {type tools} from '#/lexicons'

export type ReportSubject =
  tools.ozone.inbox.getReport.$OutputBody['report']['subject']

export function getReportSubjectLabel(
  subject: ReportSubject,
  {
    authorName,
    starterPackName,
  }: {
    authorName?: string
    starterPackName?: string
  } = {},
): MessageDescriptor {
  if ('convoId' in subject) {
    if ('messageId' in subject) {
      return authorName
        ? msg`Direct message from ${authorName}`
        : msg`Direct message`
    }
    return authorName ? msg`Conversation with ${authorName}` : msg`Conversation`
  }

  if ('uri' in subject && typeof subject.uri === 'string') {
    switch (new AtUri(subject.uri).collection) {
      case 'app.bsky.feed.post':
        return authorName ? msg`Post by ${authorName}` : msg`Post`
      case 'app.bsky.actor.status':
        return authorName ? msg`Livestream by ${authorName}` : msg`Livestream`
      case 'app.bsky.graph.list':
        return authorName ? msg`List by ${authorName}` : msg`List`
      case 'app.bsky.feed.generator':
        return authorName ? msg`Feed by ${authorName}` : msg`Feed`
      case 'app.bsky.graph.starterpack':
        return starterPackName
          ? msg`Starter Pack “${starterPackName}”`
          : msg`Starter Pack`
      default:
        return authorName ? msg`Content by ${authorName}` : msg`Content`
    }
  }

  if ('did' in subject && typeof subject.did === 'string') {
    return authorName ? msg`${authorName}` : msg`unknown account`
  }

  return msg`Content`
}
