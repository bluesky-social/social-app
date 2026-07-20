import {
  type ParsedReportSubject,
  type ReportSubject,
} from '#/components/moderation/ReportDialog/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

export function parseReportSubject(
  rawSubject: ReportSubject,
): ParsedReportSubject | undefined {
  if (!rawSubject) return

  if ('convoId' in rawSubject) {
    if ('message' in rawSubject) {
      return {
        type: 'convoMessage',
        ...rawSubject,
      }
    }
    return {
      type: 'convo',
      convoId: rawSubject.convoId,
      did: rawSubject.did,
    }
  }

  const subject = rawSubject

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
