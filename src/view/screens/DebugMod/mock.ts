import {type $Typed} from '@atproto/lex'

import {type app, type com} from '#/lexicons'

const FAKE_CID = 'bafyreiclp443lavogvhj3d2ob2cxbfuscni2k5jk7bebjzg7khl3esabwq'

const FAKE_IMAGE =
  'https://bsky.social/about/images/social-card-default-gradient.png'

/*
 * Local test-data builders for this dev-only moderation debug screen. These
 * replace the `mock` object the old api package used to export (the SDK does
 * not ship one). Each builder returns a plain `#/lexicons` object literal with
 * the same field values the old `mock` builders produced. Branded string slots
 * (`did`/`at-uri`/`cid`/`lang`) are cast, since this is trusted mock data.
 */
export const mock = {
  post({
    text,
    facets,
    reply,
    embed,
  }: {
    text: string
    facets?: app.bsky.feed.post.Main['facets']
    reply?: app.bsky.feed.post.Main['reply']
    embed?: app.bsky.feed.post.Main['embed']
  }): app.bsky.feed.post.Main {
    return {
      $type: 'app.bsky.feed.post',
      text,
      facets,
      reply,
      embed,
      langs: ['en'],
      createdAt:
        new Date().toISOString() as app.bsky.feed.post.Main['createdAt'],
    }
  },
  postView({
    rkey = 'fake',
    record,
    author,
    embed,
    replyCount,
    repostCount,
    likeCount,
    viewer,
    labels,
  }: {
    /**
     * Distinguishes several posts by the same author.
     */
    rkey?: string
    record: app.bsky.feed.post.Main
    author: app.bsky.actor.defs.ProfileViewBasic
    embed?: app.bsky.feed.defs.PostView['embed']
    replyCount?: number
    repostCount?: number
    likeCount?: number
    viewer?: app.bsky.feed.defs.ViewerState
    labels?: com.atproto.label.defs.Label[]
  }): app.bsky.feed.defs.PostView {
    return {
      $type: 'app.bsky.feed.defs#postView',
      uri: `at://${author.did}/app.bsky.feed.post/${rkey}`,
      cid: FAKE_CID,
      author,
      record,
      embed,
      replyCount,
      repostCount,
      likeCount,
      indexedAt:
        new Date().toISOString() as app.bsky.feed.defs.PostView['indexedAt'],
      viewer,
      labels,
    }
  },
  embedRecordView({
    rkey = 'fake',
    record,
    author,
    labels,
    embeds,
  }: {
    rkey?: string
    record: app.bsky.feed.post.Main
    author: app.bsky.actor.defs.ProfileViewBasic
    labels?: com.atproto.label.defs.Label[]
    /**
     * The quoted post's own embeds, e.g. its images.
     */
    embeds?: app.bsky.embed.record.ViewRecord['embeds']
  }): app.bsky.embed.record.View {
    return {
      $type: 'app.bsky.embed.record#view',
      record: {
        $type: 'app.bsky.embed.record#viewRecord',
        uri: `at://${author.did}/app.bsky.feed.post/${rkey}`,
        cid: FAKE_CID,
        author,
        value: record,
        labels,
        embeds,
        indexedAt:
          new Date().toISOString() as app.bsky.embed.record.ViewRecord['indexedAt'],
      },
    }
  },
  /**
   * A single placeholder image.
   */
  imagesView(): $Typed<app.bsky.embed.images.View> {
    return {
      $type: 'app.bsky.embed.images#view',
      images: [{thumb: FAKE_IMAGE, fullsize: FAKE_IMAGE, alt: ''}],
    }
  },
  profileViewBasic({
    handle,
    displayName,
    description,
    viewer,
    labels,
  }: {
    handle: string
    displayName?: string
    description?: string
    viewer?: app.bsky.actor.defs.ViewerState
    labels?: com.atproto.label.defs.Label[]
  }): app.bsky.actor.defs.ProfileViewBasic & {description?: string} {
    return {
      did: `did:web:${handle}`,
      handle: handle as app.bsky.actor.defs.ProfileViewBasic['handle'],
      displayName,
      description,
      viewer,
      labels,
    }
  },
  actorViewerState({
    muted,
    mutedByList,
    blockedBy,
    blocking,
    blockingByList,
    following,
    followedBy,
  }: {
    muted?: boolean
    mutedByList?: app.bsky.graph.defs.ListViewBasic
    blockedBy?: boolean
    blocking?: string
    blockingByList?: app.bsky.graph.defs.ListViewBasic
    following?: string
    followedBy?: string
  }): app.bsky.actor.defs.ViewerState {
    return {
      muted,
      mutedByList,
      blockedBy,
      blocking: blocking as app.bsky.actor.defs.ViewerState['blocking'],
      blockingByList,
      following: following as app.bsky.actor.defs.ViewerState['following'],
      followedBy: followedBy as app.bsky.actor.defs.ViewerState['followedBy'],
    }
  },
  replyNotification({
    author,
    record,
    labels,
  }: {
    record: app.bsky.feed.post.Main
    author: app.bsky.actor.defs.ProfileViewBasic
    labels?: com.atproto.label.defs.Label[]
  }): app.bsky.notification.listNotifications.Notification {
    return {
      uri: `at://${author.did}/app.bsky.feed.post/fake`,
      cid: FAKE_CID,
      author: author as app.bsky.actor.defs.ProfileView,
      reason: 'reply',
      reasonSubject: `at://${author.did}/app.bsky.feed.post/fake-parent`,
      record,
      isRead: false,
      indexedAt:
        new Date().toISOString() as app.bsky.notification.listNotifications.Notification['indexedAt'],
      labels,
    }
  },
  followNotification({
    author,
    subjectDid,
    labels,
  }: {
    author: app.bsky.actor.defs.ProfileViewBasic
    subjectDid: string
    labels?: com.atproto.label.defs.Label[]
  }): app.bsky.notification.listNotifications.Notification {
    return {
      uri: `at://${author.did}/app.bsky.graph.follow/fake`,
      cid: FAKE_CID,
      author: author as app.bsky.actor.defs.ProfileView,
      reason: 'follow',
      record: {
        $type: 'app.bsky.graph.follow',
        createdAt: new Date().toISOString(),
        subject: subjectDid,
      },
      isRead: false,
      indexedAt:
        new Date().toISOString() as app.bsky.notification.listNotifications.Notification['indexedAt'],
      labels,
    }
  },
  generatorView({
    creator,
    displayName,
  }: {
    creator: app.bsky.actor.defs.ProfileViewBasic
    displayName: string
  }): app.bsky.feed.defs.GeneratorView {
    return {
      $type: 'app.bsky.feed.defs#generatorView',
      uri: `at://${creator.did}/app.bsky.feed.generator/fake`,
      cid: FAKE_CID,
      did: 'did:web:feeds.example.com',
      creator: {...creator, $type: 'app.bsky.actor.defs#profileView'},
      displayName,
      indexedAt:
        new Date().toISOString() as app.bsky.feed.defs.GeneratorView['indexedAt'],
    }
  },
  starterPackView({
    creator,
    name,
  }: {
    creator: app.bsky.actor.defs.ProfileViewBasic
    name: string
  }): app.bsky.graph.defs.StarterPackView {
    const createdAt = new Date().toISOString()
    return {
      $type: 'app.bsky.graph.defs#starterPackView',
      uri: `at://${creator.did}/app.bsky.graph.starterpack/fake`,
      cid: FAKE_CID,
      creator,
      record: {
        $type: 'app.bsky.graph.starterpack',
        name,
        list: `at://${creator.did}/app.bsky.graph.list/fake`,
        createdAt,
      },
      indexedAt: createdAt as app.bsky.graph.defs.StarterPackView['indexedAt'],
    }
  },
  label({
    val,
    uri,
    src,
  }: {
    val: string
    uri: string
    src?: string
  }): com.atproto.label.defs.Label {
    return {
      src: (src ||
        'did:plc:fake-labeler') as com.atproto.label.defs.Label['src'],
      uri: uri as com.atproto.label.defs.Label['uri'],
      val,
      cts: new Date().toISOString() as com.atproto.label.defs.Label['cts'],
    }
  },
}
