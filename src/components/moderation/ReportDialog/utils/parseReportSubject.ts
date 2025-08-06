import {
  AppGndrActorDefs,
  AppGndrFeedDefs,
  AppGndrFeedPost,
  AppGndrGraphDefs,
} from '@gander-social-atproto/api'

import {
  type ParsedReportSubject,
  type ReportSubject,
} from '#/components/moderation/ReportDialog/types'
import * as gndr from '#/types/gndr'

export function parseReportSubject(
  subject: ReportSubject,
): ParsedReportSubject | undefined {
  if (!subject) return

  if ('convoId' in subject) {
    return {
      type: 'chatMessage',
      ...subject,
    }
  }

  if (
    AppGndrActorDefs.isProfileViewBasic(subject) ||
    AppGndrActorDefs.isProfileView(subject) ||
    AppGndrActorDefs.isProfileViewDetailed(subject)
  ) {
    return {
      type: 'account',
      did: subject.did,
      nsid: 'app.gndr.actor.profile',
    }
  } else if (AppGndrGraphDefs.isListView(subject)) {
    return {
      type: 'list',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.gndr.graph.list',
    }
  } else if (AppGndrFeedDefs.isGeneratorView(subject)) {
    return {
      type: 'feed',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.gndr.feed.generator',
    }
  } else if (AppGndrGraphDefs.isStarterPackView(subject)) {
    return {
      type: 'starterPack',
      uri: subject.uri,
      cid: subject.cid,
      nsid: 'app.gndr.graph.starterPack',
    }
  } else if (AppGndrFeedDefs.isPostView(subject)) {
    const record = subject.record
    const embed = gndr.post.parseEmbed(subject.embed)
    if (
      gndr.dangerousIsType<AppGndrFeedPost.Record>(
        record,
        AppGndrFeedPost.isRecord,
      )
    ) {
      return {
        type: 'post',
        uri: subject.uri,
        cid: subject.cid,
        nsid: 'app.gndr.feed.post',
        attributes: {
          reply: !!record.reply,
          image:
            embed.type === 'images' ||
            (embed.type === 'post_with_media' && embed.media.type === 'images'),
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
