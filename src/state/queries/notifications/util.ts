import {type Client} from '@atproto/lex-client'
import {type AtUriString} from '@atproto/syntax'
import {
  hasMutedWord,
  moderateNotification,
  type ModerationOpts,
} from '@bsky.app/sdk/moderation'
import {type QueryClient} from '@tanstack/react-query'
import chunk from 'lodash.chunk'

import {labelIsHideableOffense} from '#/lib/moderation'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {precacheProfile} from '../profile'
import {
  type FeedNotification,
  type FeedPage,
  type NotificationType,
} from './types'

const GROUPABLE_REASONS = [
  'like',
  'repost',
  'follow',
  'like-via-repost',
  'repost-via-repost',
  'subscribed-post',
]
const MS_1HR = 1e3 * 60 * 60
const MS_2DAY = MS_1HR * 48

// exported api
// =

export async function fetchPage({
  client,
  cursor,
  limit,
  queryClient,
  moderationOpts,
  fetchAdditionalData,
  reasons,
}: {
  client: Client
  cursor: string | undefined
  limit: number
  queryClient: QueryClient
  moderationOpts: ModerationOpts | undefined
  fetchAdditionalData: boolean
  reasons: string[]
}): Promise<{
  page: FeedPage
  indexedAt: string | undefined
}> {
  const res = await client.call(app.bsky.notification.listNotifications, {
    limit,
    cursor,
    reasons,
  })

  const indexedAt = res.notifications[0]?.indexedAt

  // filter out notifs by mod rules
  const notifs = res.notifications.filter(
    notif => !shouldFilterNotif(notif, moderationOpts),
  )

  // group notifications which are essentially similar (follows, likes on a post)
  let notifsGrouped = groupNotifications(notifs)

  // we fetch subjects of notifications (usually posts) now instead of lazily
  // in the UI to avoid relayouts
  if (fetchAdditionalData) {
    const subjects = await fetchSubjects(client, notifsGrouped)
    for (const notif of notifsGrouped) {
      if (notif.subjectUri) {
        if (
          notif.type === 'starterpack-joined' &&
          notif.notification.reasonSubject
        ) {
          notif.subject = subjects.starterPacks.get(
            notif.notification.reasonSubject,
          )
        } else {
          notif.subject = subjects.posts.get(notif.subjectUri)
          if (notif.subject) {
            precacheProfile(queryClient, notif.subject.author)
          }
        }
      }
    }
  }

  let seenAt = res.seenAt ? new Date(res.seenAt) : new Date()
  if (Number.isNaN(seenAt.getTime())) {
    seenAt = new Date()
  }

  return {
    page: {
      cursor: res.cursor,
      seenAt,
      items: notifsGrouped,
      priority: res.priority ?? false,
    },
    indexedAt,
  }
}

// internal methods
// =

export function shouldFilterNotif(
  notif: app.bsky.notification.listNotifications.Notification,
  moderationOpts: ModerationOpts | undefined,
): boolean {
  const containsImperative = !!notif.author.labels?.some(labelIsHideableOffense)
  if (containsImperative) {
    return true
  }
  if (!moderationOpts) {
    return false
  }
  if (
    notif.reason === 'subscribed-post' &&
    bsky.isType(app.bsky.feed.post, notif.record) &&
    hasMutedWord({
      mutedWords: moderationOpts.prefs.mutedWords,
      text: notif.record.text,
      facets: notif.record.facets,
      outlineTags: notif.record.tags,
      languages: notif.record.langs,
      actor: notif.author,
    })
  ) {
    return true
  }
  if (notif.author.viewer?.following) {
    return false
  }
  return moderateNotification(notif, moderationOpts).ui('contentList').filter
}

export function groupNotifications(
  notifs: app.bsky.notification.listNotifications.Notification[],
): FeedNotification[] {
  const groupedNotifs: FeedNotification[] = []
  for (const notif of notifs) {
    const ts = +new Date(notif.indexedAt)
    let grouped = false
    if (GROUPABLE_REASONS.includes(notif.reason)) {
      for (const groupedNotif of groupedNotifs) {
        const ts2 = +new Date(groupedNotif.notification.indexedAt)
        if (
          Math.abs(ts2 - ts) < MS_2DAY &&
          notif.reason === groupedNotif.notification.reason &&
          notif.reasonSubject === groupedNotif.notification.reasonSubject &&
          (notif.author.did !== groupedNotif.notification.author.did ||
            notif.reason === 'subscribed-post')
        ) {
          const nextIsFollowBack =
            notif.reason === 'follow' && notif.author.viewer?.following
          const prevIsFollowBack =
            groupedNotif.notification.reason === 'follow' &&
            groupedNotif.notification.author.viewer?.following
          const shouldUngroup = nextIsFollowBack || prevIsFollowBack
          if (!shouldUngroup) {
            groupedNotif.additional = groupedNotif.additional || []
            groupedNotif.additional.push(notif)
            grouped = true
            break
          }
        }
      }
    }
    if (!grouped) {
      const type = toKnownType(notif)
      if (type !== 'starterpack-joined') {
        groupedNotifs.push({
          _reactKey: `notif-${notif.uri}-${notif.reason}`,
          type,
          notification: notif,
          subjectUri: getSubjectUri(type, notif),
        })
      } else {
        groupedNotifs.push({
          _reactKey: `notif-${notif.uri}-${notif.reason}`,
          type: 'starterpack-joined',
          notification: notif,
          subjectUri: notif.uri,
        })
      }
    }
  }
  return groupedNotifs
}

async function fetchSubjects(
  client: Client,
  groupedNotifs: FeedNotification[],
): Promise<{
  posts: Map<string, app.bsky.feed.defs.PostView>
  starterPacks: Map<string, app.bsky.graph.defs.StarterPackViewBasic>
}> {
  /*
   * Subject/reason-subject URIs arrive as plain `string` on the notification,
   * so brand them to the at-uri slot the getPosts/getStarterPacks params expect.
   */
  const postUris = new Set<AtUriString>()
  const packUris = new Set<AtUriString>()
  for (const notif of groupedNotifs) {
    if (notif.subjectUri?.includes('app.bsky.feed.post')) {
      postUris.add(notif.subjectUri as AtUriString)
    } else if (
      notif.notification.reasonSubject?.includes('app.bsky.graph.starterpack')
    ) {
      packUris.add(notif.notification.reasonSubject)
    }
  }
  const postUriChunks = chunk(Array.from(postUris), 25)
  const packUriChunks = chunk(Array.from(packUris), 25)
  const postsChunks = await Promise.all(
    postUriChunks.map(uris =>
      client.call(app.bsky.feed.getPosts, {uris}).then(res => res.posts),
    ),
  )
  const packsChunks = await Promise.all(
    packUriChunks.map(uris =>
      client
        .call(app.bsky.graph.getStarterPacks, {uris})
        .then(res => res.starterPacks),
    ),
  )
  const postsMap = new Map<string, app.bsky.feed.defs.PostView>()
  const packsMap = new Map<string, app.bsky.graph.defs.StarterPackViewBasic>()
  for (const post of postsChunks.flat()) {
    if (bsky.isType(app.bsky.feed.post, post.record)) {
      postsMap.set(post.uri, post)
    }
  }
  for (const pack of packsChunks.flat()) {
    if (bsky.isType(app.bsky.graph.starterpack, pack.record)) {
      packsMap.set(pack.uri, pack)
    }
  }
  return {
    posts: postsMap,
    starterPacks: packsMap,
  }
}

function toKnownType(
  notif: app.bsky.notification.listNotifications.Notification,
): NotificationType {
  if (notif.reason === 'like') {
    if (notif.reasonSubject?.includes('feed.generator')) {
      return 'feedgen-like'
    }
    return 'post-like'
  }
  if (
    notif.reason === 'repost' ||
    notif.reason === 'mention' ||
    notif.reason === 'reply' ||
    notif.reason === 'quote' ||
    notif.reason === 'follow' ||
    notif.reason === 'starterpack-joined' ||
    notif.reason === 'verified' ||
    notif.reason === 'unverified' ||
    notif.reason === 'like-via-repost' ||
    notif.reason === 'repost-via-repost' ||
    notif.reason === 'subscribed-post' ||
    notif.reason === 'contact-match'
  ) {
    return notif.reason as NotificationType
  }
  return 'unknown'
}

function getSubjectUri(
  type: NotificationType,
  notif: app.bsky.notification.listNotifications.Notification,
): string | undefined {
  if (
    type === 'reply' ||
    type === 'quote' ||
    type === 'mention' ||
    type === 'subscribed-post'
  ) {
    return notif.uri
  } else if (
    type === 'post-like' ||
    type === 'repost' ||
    type === 'like-via-repost' ||
    type === 'repost-via-repost'
  ) {
    if (
      bsky.isType(app.bsky.feed.repost, notif.record) ||
      bsky.isType(app.bsky.feed.like, notif.record)
    ) {
      return typeof notif.record.subject?.uri === 'string'
        ? notif.record.subject?.uri
        : undefined
    }
  } else if (type === 'feedgen-like') {
    return notif.reasonSubject
  }
}
