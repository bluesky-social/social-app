import {
  AppBskyFeedDefs,
  AppBskyFeedLike,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyGraphDefs,
  AppBskyGraphStarterpack,
  AppBskyNotificationListNotifications,
  BskyAgent,
  moderateNotification,
  ModerationOpts,
} from '@atproto/api'
import {QueryClient} from '@tanstack/react-query'
import chunk from 'lodash.chunk'

import {labelIsHideableOffense} from '#/lib/moderation'
import {precacheProfile} from '../profile'
import {FeedNotification, FeedPage, NotificationType} from './types'

const GROUPABLE_REASONS = ['like', 'repost', 'follow']
const MS_1HR = 1e3 * 60 * 60
const MS_2DAY = MS_1HR * 48

// exported api
// =

export async function fetchPage({
  agent,
  cursor,
  limit,
  queryClient,
  moderationOpts,
  fetchAdditionalData,
}: {
  agent: BskyAgent
  cursor: string | undefined
  limit: number
  queryClient: QueryClient
  moderationOpts: ModerationOpts | undefined
  fetchAdditionalData: boolean
  priority?: boolean
}): Promise<{
  page: FeedPage
  indexedAt: string | undefined
}> {
  const res = await agent.listNotifications({
    limit,
    cursor,
    // priority,
  })

  const indexedAt = res.data.notifications[0]?.indexedAt

  // filter out notifs by mod rules
  const notifs = res.data.notifications.filter(
    notif => !shouldFilterNotif(notif, moderationOpts),
  )

  // group notifications which are essentially similar (follows, likes on a post)
  let notifsGrouped = groupNotifications(notifs)

  // we fetch subjects of notifications (usually posts) now instead of lazily
  // in the UI to avoid relayouts
  if (fetchAdditionalData) {
    const subjects = await fetchSubjects(agent, notifsGrouped)
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

  let seenAt = res.data.seenAt ? new Date(res.data.seenAt) : new Date()
  if (Number.isNaN(seenAt.getTime())) {
    seenAt = new Date()
  }

  return {
    page: {
      cursor: res.data.cursor,
      seenAt,
      items: notifsGrouped,
      priority: res.data.priority ?? false,
    },
    indexedAt,
  }
}

// internal methods
// =

export function shouldFilterNotif(
  notif: AppBskyNotificationListNotifications.Notification,
  moderationOpts: ModerationOpts | undefined,
): boolean {
  const containsImperative = !!notif.author.labels?.some(labelIsHideableOffense)
  if (containsImperative) {
    return true
  }
  if (!moderationOpts) {
    return false
  }
  if (notif.author.viewer?.following) {
    return false
  }
  return moderateNotification(notif, moderationOpts).ui('contentList').filter
}

export function groupNotifications(
  notifs: AppBskyNotificationListNotifications.Notification[],
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
          notif.author.did !== groupedNotif.notification.author.did
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
          _reactKey: `notif-${notif.uri}`,
          type,
          notification: notif,
          subjectUri: getSubjectUri(type, notif),
        })
      } else {
        groupedNotifs.push({
          _reactKey: `notif-${notif.uri}`,
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
  agent: BskyAgent,
  groupedNotifs: FeedNotification[],
): Promise<{
  posts: Map<string, AppBskyFeedDefs.PostView>
  starterPacks: Map<string, AppBskyGraphDefs.StarterPackViewBasic>
}> {
  const postUris = new Set<string>()
  const packUris = new Set<string>()
  for (const notif of groupedNotifs) {
    if (notif.subjectUri?.includes('app.bsky.feed.post')) {
      postUris.add(notif.subjectUri)
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
      agent.app.bsky.feed.getPosts({uris}).then(res => res.data.posts),
    ),
  )
  const packsChunks = await Promise.all(
    packUriChunks.map(uris =>
      agent.app.bsky.graph
        .getStarterPacks({uris})
        .then(res => res.data.starterPacks),
    ),
  )
  const postsMap = new Map<string, AppBskyFeedDefs.PostView>()
  const packsMap = new Map<string, AppBskyGraphDefs.StarterPackView>()
  for (const post of postsChunks.flat()) {
    if (
      AppBskyFeedPost.isRecord(post.record) &&
      AppBskyFeedPost.validateRecord(post.record).success
    ) {
      postsMap.set(post.uri, post)
    }
  }
  for (const pack of packsChunks.flat()) {
    if (AppBskyGraphStarterpack.isRecord(pack.record)) {
      packsMap.set(pack.uri, pack)
    }
  }
  return {
    posts: postsMap,
    starterPacks: packsMap,
  }
}

function toKnownType(
  notif: AppBskyNotificationListNotifications.Notification,
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
    notif.reason === 'starterpack-joined'
  ) {
    return notif.reason as NotificationType
  }
  return 'unknown'
}

function getSubjectUri(
  type: NotificationType,
  notif: AppBskyNotificationListNotifications.Notification,
): string | undefined {
  if (type === 'reply' || type === 'quote' || type === 'mention') {
    return notif.uri
  } else if (type === 'post-like' || type === 'repost') {
    if (
      AppBskyFeedRepost.isRecord(notif.record) ||
      AppBskyFeedLike.isRecord(notif.record)
    ) {
      return typeof notif.record.subject?.uri === 'string'
        ? notif.record.subject?.uri
        : undefined
    }
  } else if (type === 'feedgen-like') {
    return notif.reasonSubject
  }
}
