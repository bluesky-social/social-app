import {type DidString} from '@atproto/syntax'
import {type ModerationOpts} from '@bsky/sdk/moderation'
import {describe, expect, it} from '@jest/globals'

import {
  createGroupedNotificationsFixture,
  VIEWER_DID,
} from '#/state/queries/notifications/grouped/__fixtures__'
import {hydratePage} from '#/state/queries/notifications/grouped/hydrate'
import {
  moderateNotification,
  type NotificationModerationArgs,
} from '#/state/queries/notifications/grouped/moderate'
import {
  type NotificationView,
  type NotificationViewType,
} from '#/state/queries/notifications/grouped/types'
import {type app, type com} from '#/lexicons'

type PostView = app.bsky.feed.defs.PostView

/**
 * Any profile view, so the helpers work on actors and post authors alike.
 */
type Profile = {
  did: string
  handle: string
  viewer?: app.bsky.actor.defs.ViewerState
  labels?: com.atproto.label.defs.Label[]
}

const NOW = new Date('2026-10-08T12:00:00.000Z')
const LABELER: DidString = 'did:plc:labeler'

const PAGE = hydratePage(createGroupedNotificationsFixture(NOW), {
  viewerDid: VIEWER_DID,
})

const MODERATION_OPTS: ModerationOpts = {
  userDid: VIEWER_DID,
  prefs: {
    adultContentEnabled: false,
    labels: {},
    labelers: [{did: LABELER, labels: {}}],
    mutedWords: [],
    hiddenPosts: [],
  },
  labelDefs: {},
}

const ARGS: NotificationModerationArgs = {
  moderationOpts: MODERATION_OPTS,
  hiddenReplyUris: new Set(),
}

function get<T extends NotificationViewType>(
  id: string,
  type: T,
): Extract<NotificationView, {type: T}> {
  const notification = PAGE.notifications.find(n => n.id === id)
  if (notification?.type !== type) {
    throw new Error(`Expected ${id} to be a ${type}, got ${notification?.type}`)
  }
  return notification as Extract<NotificationView, {type: T}>
}

function label(uri: string, val: string): com.atproto.label.defs.Label {
  return {
    src: LABELER,
    uri: uri as com.atproto.label.defs.Label['uri'],
    val,
    cts: NOW.toISOString() as com.atproto.label.defs.Label['cts'],
  }
}

function blocked<T extends Profile>(actor: T): T {
  return {
    ...actor,
    viewer: {
      ...actor.viewer,
      blocking: `at://${VIEWER_DID}/app.bsky.graph.block/${actor.handle}`,
    },
  }
}

function muted<T extends Profile>(actor: T): T {
  return {...actor, viewer: {...actor.viewer, muted: true}}
}

function hideableOffense<T extends Profile>(actor: T): T {
  return {...actor, labels: [label(actor.did, '!hide')]}
}

function byAuthor(post: PostView, author: PostView['author']): PostView {
  return {...post, author}
}

describe('moderateNotification', () => {
  it('returns the same object when nothing is hidden', () => {
    for (const notification of PAGE.notifications) {
      expect(moderateNotification(notification, ARGS)).toBe(notification)
    }
  })

  describe('aggregate actors', () => {
    it('trims hidden actors and keeps the server count', () => {
      const like = get('like-fungus', 'like')
      const [danielle, michael, ...rest] = like.actors
      const result = moderateNotification(
        {...like, actors: [danielle, blocked(michael), ...rest]},
        ARGS,
      )
      expect(result).toEqual({...like, actors: [danielle, ...rest]})
      expect(result?.count).toBe(like.count)
    })

    it('promotes the next actor when the primary one is hidden', () => {
      const follow = get('follow-many', 'follow')
      const [first, second, ...rest] = follow.actors
      const result = moderateNotification(
        {...follow, actors: [muted(first), second, ...rest]},
        ARGS,
      )
      expect(result?.type === 'follow' && result.actors[0]).toBe(second)
    })

    it('removes hidden followers from the DIDs left to load', () => {
      const follow = get('follow-many', 'follow')
      const [first, ...rest] = follow.actors
      const result = moderateNotification(
        {...follow, actors: [blocked(first), ...rest]},
        ARGS,
      )
      expect(result).toEqual({
        ...follow,
        actors: rest,
        actorDids: follow.actorDids.filter(did => did !== first.did),
      })
    })

    it('drops the group when every actor is hidden', () => {
      const follow = get('follow-single', 'follow')
      expect(
        moderateNotification(
          {...follow, actors: [blocked(follow.actors[0])]},
          ARGS,
        ),
      ).toBeUndefined()
    })

    it('keeps actors the viewer follows, even when muted', () => {
      const like = get('like-fungus', 'like')
      const danielle = muted(like.actors[0])
      expect(danielle.viewer?.following).toBeTruthy()
      const notification = {...like, actors: [danielle]} as NotificationView
      expect(moderateNotification(notification, ARGS)).toBe(notification)
    })

    it('always hides hideable offenses, even from people the viewer follows', () => {
      const like = get('like-fungus', 'like')
      const [danielle, ...rest] = like.actors
      const result = moderateNotification(
        {...like, actors: [hideableOffense(danielle), ...rest]},
        {...ARGS, moderationOpts: undefined},
      )
      expect(result).toEqual({...like, actors: rest})
    })
  })

  describe('single actors', () => {
    it('drops the notification when the actor is hidden', () => {
      const contactMatch = get('contact-match', 'contactMatch')
      expect(
        moderateNotification(
          {...contactMatch, actor: muted(contactMatch.actor)},
          ARGS,
        ),
      ).toBeUndefined()
    })

    it('keeps it when the viewer follows the actor', () => {
      const followBack = get('follow-back', 'followBack')
      const notification = {...followBack, actor: muted(followBack.actor)}
      expect(moderateNotification(notification, ARGS)).toBe(notification)
    })
  })

  describe('posts', () => {
    it('drops replies hidden by a threadgate', () => {
      const reply = get('reply-oyster', 'reply')
      expect(
        moderateNotification(reply, {
          ...ARGS,
          hiddenReplyUris: new Set([reply.post.uri]),
        }),
      ).toBeUndefined()
    })

    it('drops posts filtered from content lists', () => {
      const reply = get('reply-oyster', 'reply')
      expect(
        moderateNotification(
          {...reply, post: byAuthor(reply.post, blocked(reply.post.author))},
          ARGS,
        ),
      ).toBeUndefined()

      const quote = get('quote-fungus', 'quote')
      expect(
        moderateNotification(
          {
            ...quote,
            post: {...quote.post, labels: [label(quote.post.uri, '!hide')]},
          },
          ARGS,
        ),
      ).toBeUndefined()
    })

    it('only applies threadgates without moderation opts', () => {
      const reply = get('reply-oyster', 'reply')
      const notification = {
        ...reply,
        post: byAuthor(reply.post, blocked(reply.post.author)),
      }
      expect(
        moderateNotification(notification, {
          ...ARGS,
          moderationOpts: undefined,
        }),
      ).toBe(notification)
    })
  })

  describe('subscribed posts', () => {
    it('trims posts with muted words', () => {
      const subscribed = get('subscribed-many', 'subscribedPost')
      const [, ...rest] = subscribed.items
      const result = moderateNotification(subscribed, {
        ...ARGS,
        moderationOpts: {
          ...MODERATION_OPTS,
          prefs: {
            ...MODERATION_OPTS.prefs,
            mutedWords: [{value: 'chanterelles', targets: ['content']}],
          },
        },
      })
      expect(result).toEqual({...subscribed, items: rest})
    })

    it('trims labelled posts unless the viewer follows the author', () => {
      const subscribed = get('subscribed-many', 'subscribedPost')
      const hidden = subscribed.items.map(item => ({
        ...item,
        post: {...item.post, labels: [label(item.post.uri, '!hide')]},
      }))
      const result = moderateNotification(
        {...subscribed, items: [hidden[0], hidden[1], hidden[2]]},
        ARGS,
      )
      // The first author isn't followed, the other two are
      expect(result).toEqual({...subscribed, items: [hidden[1], hidden[2]]})
    })
  })
})
