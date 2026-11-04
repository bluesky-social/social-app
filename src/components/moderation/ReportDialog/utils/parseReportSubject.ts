import {parseAtUriString} from '@atproto/syntax'

import {
  type ParsedReportSubject,
  type ReportSubject,
} from '#/components/moderation/ReportDialog/types'
import {app, com} from '#/lexicons'
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
  } else if (
    bsky.isType(app.bsky.embed.external.viewArticle, subject) ||
    bsky.isType(app.bsky.embed.external.viewGallery, subject)
  ) {
    /*
     * The view's own uri is the external destination, so report the first
     * valid record it was associated with instead.
     */
    const isArticle = bsky.isType(app.bsky.embed.external.viewArticle, subject)
    for (const ref of subject.associatedRefs ?? []) {
      if (!bsky.matches(com.atproto.repo.strongRef.main, ref)) continue
      const uri = parseAtUriString(ref.uri)
      if (!uri.success || !uri.value.collection || !uri.value.rkey) continue
      return {
        type: isArticle ? 'article' : 'photo',
        uri: ref.uri,
        cid: ref.cid,
        nsid: uri.value.collection,
      }
    }
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
