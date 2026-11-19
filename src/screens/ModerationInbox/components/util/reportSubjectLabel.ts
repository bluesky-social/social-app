import {AtUri, isAtUriString} from '@atproto/syntax'
import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {place, site, social, type tools} from '#/lexicons'

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

  if (
    'uri' in subject &&
    typeof subject.uri === 'string' &&
    isAtUriString(subject.uri, {strict: false})
  ) {
    switch (new AtUri(subject.uri).collection) {
      case 'app.bsky.feed.post':
        return authorName ? msg`Post by ${authorName}` : msg`Post`
      case 'app.bsky.actor.status':
        return authorName
          ? msg`Account status by ${authorName}`
          : msg`Account status`
      case place.stream.livestream.$type:
        return authorName ? msg`Livestream by ${authorName}` : msg`Livestream`
      case site.standard.document.$type:
        return authorName ? msg`Article by ${authorName}` : msg`Article`
      case site.standard.publication.$type:
        return authorName ? msg`Publication by ${authorName}` : msg`Publication`
      case social.grain.gallery.$type:
        return authorName ? msg`Gallery by ${authorName}` : msg`Gallery`
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
    return authorName ? msg`Account ${authorName}` : msg`Account unknown`
  }

  return msg`Content`
}
