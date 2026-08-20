import {
  type ParsedReportSubject,
  type ReportSubject,
} from '#/components/moderation/ReportDialog/types'
import * as AppBskyActorDefs from '#/lexicons/app/bsky/actor/defs'
import * as AppBskyFeedDefs from '#/lexicons/app/bsky/feed/defs'
import * as AppBskyFeedPost from '#/lexicons/app/bsky/feed/post'
import * as AppBskyGraphDefs from '#/lexicons/app/bsky/graph/defs'
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
    bsky.isType(AppBskyActorDefs.profileViewBasic, subject) ||
    bsky.isType(AppBskyActorDefs.profileView, subject) ||
    bsky.isType(AppBskyActorDefs.profileViewDetailed, subject)
  ) {
    return {
      type: 'account',
      did: subject.did,
      nsid: 'app.bsky.actor.profile',
    }
  } else if (bsky.isType(AppBskyActorDefs.statusView, subject)) {
    if (!subject.uri || !subject.cid) return
    return {
      type: 'status',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.bsky.actor.status',
    }
  } else if (bsky.isType(AppBskyGraphDefs.listView, subject)) {
    return {
      type: 'list',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.bsky.graph.list',
    }
  } else if (bsky.isType(AppBskyFeedDefs.generatorView, subject)) {
    return {
      type: 'feed',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.bsky.feed.generator',
    }
  } else if (bsky.isType(AppBskyGraphDefs.starterPackView, subject)) {
    return {
      type: 'starterPack',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.bsky.graph.starterPack',
    }
  } else if (bsky.isType(AppBskyFeedDefs.postView, subject)) {
    const record = subject.record
    const embed = bsky.post.parseEmbed(subject.embed)
    if (bsky.isType(AppBskyFeedPost, record)) {
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
