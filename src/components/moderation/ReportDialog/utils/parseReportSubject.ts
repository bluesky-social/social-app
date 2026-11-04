import {type $Typed} from '@atproto/lex'
import {parseAtUriString} from '@atproto/syntax'

import {
  type ParsedReportSubject,
  type ReportSubject,
} from '#/components/moderation/ReportDialog/types'
import {app, com, place, site, social} from '#/lexicons'
import * as bsky from '#/types/bsky'

export function parseReportSubject(
  subject: ReportSubject,
): ParsedReportSubject | undefined {
  if (!subject) return

  if ('convoId' in subject) {
    if ('message' in subject) {
      return {
        type: 'convoMessage',
        ...subject,
      }
    }
    return {
      type: 'convo',
      convoId: subject.convoId,
      did: subject.did,
    }
  }

  if (
    bsky.isType(app.bsky.actor.defs.profileViewBasic, subject) ||
    bsky.isType(app.bsky.actor.defs.profileView, subject) ||
    bsky.isType(app.bsky.actor.defs.profileViewDetailed, subject)
  ) {
    return {
      type: 'account',
      did: subject.did,
      nsid: 'app.bsky.actor.profile',
    }
  } else if (bsky.isType(app.bsky.actor.defs.statusView, subject)) {
    if (!subject.uri || !subject.cid) return
    return {
      type: 'status',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.bsky.actor.status',
    }
  } else if (bsky.isType(app.bsky.graph.defs.listView, subject)) {
    return {
      type: 'list',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.bsky.graph.list',
    }
  } else if (bsky.isType(app.bsky.feed.defs.generatorView, subject)) {
    return {
      type: 'feed',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.bsky.feed.generator',
    }
  } else if (bsky.isType(app.bsky.graph.defs.starterPackView, subject)) {
    return {
      type: 'starterPack',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.bsky.graph.starterPack',
    }
  } else if (bsky.isType(app.bsky.actor.defs.profileLinkView, subject)) {
    return {
      type: 'profileLink',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.bsky.actor.link',
    }
  } else if (bsky.isType(com.atproto.repo.strongRef.main, subject)) {
    return parseRecordRef(subject)
  } else if (
    bsky.isType(app.bsky.embed.external.viewArticle, subject) ||
    bsky.isType(app.bsky.embed.external.viewGallery, subject)
  ) {
    /*
     * The view's own uri is the external destination, so report the first
     * valid record it was associated with instead.
     */
    return getAssociatedReportSubjects(subject.associatedRefs)[0]?.parsedSubject
  } else if (bsky.isType(app.bsky.feed.defs.postView, subject)) {
    const record = subject.record
    const embed = bsky.post.parseEmbed(subject.embed)
    if (bsky.isType(app.bsky.feed.post, record)) {
      return {
        type: 'post',
        uri: subject.uri,
        cid: subject.cid,
        nsid: 'app.bsky.feed.post',
        attributes: {
          reply: !!record.reply,
          image:
            embed.type === 'images' ||
            embed.type === 'gallery' ||
            (embed.type === 'post_with_media' &&
              (embed.media.type === 'images' ||
                embed.media.type === 'gallery')),
          video:
            embed.type === 'video' ||
            (embed.type === 'post_with_media' && embed.media.type === 'video'),
          link:
            embed.type === 'link' ||
            (embed.type === 'post_with_media' && embed.media.type === 'link'),
          quote:
            embed.type === 'post' ||
            (embed.type === 'post_with_media' &&
              (embed.view.type === 'post' ||
                embed.view.type === 'post_with_media')),
        },
      }
    }
  }
}

/**
 * Every distinct record in `refs` that can be reported, in response order.
 *
 * `subject` is the exact ref to hand the dialog, so that it cannot reselect
 * another one. `parsedSubject` is what the dialog derives from it, e.g. for
 * its copy. A repeated URI keeps its first valid ref.
 */
export function getAssociatedReportSubjects(
  refs: readonly com.atproto.repo.strongRef.Main[] | undefined,
): {
  subject: $Typed<com.atproto.repo.strongRef.Main>
  parsedSubject: ParsedReportSubject
}[] {
  const targets: ReturnType<typeof getAssociatedReportSubjects> = []
  for (const ref of refs ?? []) {
    const parsedSubject = parseRecordRef(ref)
    if (!parsedSubject || targets.some(t => t.subject.uri === ref.uri)) continue
    targets.push({
      subject: {
        $type: 'com.atproto.repo.strongRef',
        uri: ref.uri,
        cid: ref.cid,
      },
      parsedSubject,
    })
  }
  return targets
}

/**
 * Validates a record reference and classifies it by its exact collection, so
 * unrecognized collections are still reportable as a generic record.
 */
function parseRecordRef(ref: unknown): ParsedReportSubject | undefined {
  if (!bsky.matches(com.atproto.repo.strongRef.main, ref)) return
  const uri = parseAtUriString(ref.uri)
  if (!uri.success || !uri.value.collection || !uri.value.rkey) return
  const nsid = uri.value.collection
  return {type: getRecordType(nsid), uri: ref.uri, cid: ref.cid, nsid}
}

function getRecordType(nsid: string) {
  switch (nsid) {
    case site.standard.document.$type:
      return 'article'
    case site.standard.publication.$type:
      return 'publication'
    case social.grain.photo.$type:
      return 'photo'
    case social.grain.gallery.$type:
      return 'gallery'
    case place.stream.livestream.$type:
      return 'livestream'
    default:
      return 'record'
  }
}
