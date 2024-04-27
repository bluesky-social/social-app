import {
  AppBskyEmbedRecord,
  AppBskyFeedDefs,
  AppBskyFeedLike,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyNotificationListNotifications,
  BskyAgent,
  moderateNotification,
  ModerationOpts,
} from '@atproto/api'
import {QueryClient} from '@tanstack/react-query'
import chunk from 'lodash.chunk'

import {precacheProfile} from '../profile'
import {FeedNotification, FeedPage, NotificationType} from './types'

const GROUPABLE_REASONS = ['like', 'repost', 'follow']
const MS_1HR = 1e3 * 60 * 60
const MS_2DAY = MS_1HR * 48

// exported api
// =

export async function fetchPage({
  getAgent,
  cursor,
  limit,
  queryClient,
  moderationOpts,
  threadMutes,
  fetchAdditionalData,
}: {
  getAgent: () => BskyAgent
  cursor: string | undefined
  limit: number
  queryClient: QueryClient
  moderationOpts: ModerationOpts | undefined
  threadMutes: string[]
  fetchAdditionalData: boolean
}): Promise<{page: FeedPage; indexedAt: string | undefined}> {
  const res = await getAgent().listNotifications({
    limit,
    cursor,
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
    const subjects = await fetchSubjects(getAgent, notifsGrouped)
    for (const notif of notifsGrouped) {
      if (notif.subjectUri) {
        notif.subject = subjects.get(notif.subjectUri)
        if (notif.subject) {
          precacheProfile(queryClient, notif.subject.author)
        }
      }
    }
  }

  // apply thread muting
  notifsGrouped = notifsGrouped.filter(
    notif => !isThreadMuted(notif, threadMutes),
  )

  let seenAt = res.data.seenAt ? new Date(res.data.seenAt) : new Date()
  if (Number.isNaN(seenAt.getTime())) {
    seenAt = new Date()
  }

  return {
    page: {
      cursor: res.data.cursor,
      seenAt,
      items: notifsGrouped,
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
          groupedNotif.additional = groupedNotif.additional || []
          groupedNotif.additional.push(notif)
          grouped = true
          break
        }
      }
    }
    if (!grouped) {
      const type = toKnownType(notif)
      groupedNotifs.push({
        _reactKey: `notif-${notif.uri}`,
        type,
        notification: notif,
        subjectUri: getSubjectUri(type, notif),
      })
    }
  }
  return groupedNotifs
}

async function fetchSubjects(
  getAgent: () => BskyAgent,
  groupedNotifs: FeedNotification[],
): Promise<Map<string, AppBskyFeedDefs.PostView>> {
  const uris = new Set<string>()
  for (const notif of groupedNotifs) {
    if (notif.subjectUri && !notif.subjectUri.includes('feed.generator')) {
      uris.add(notif.subjectUri)
    }
  }
  const uriChunks = chunk(Array.from(uris), 25)
  const postsChunks = await Promise.all(
    uriChunks.map(uris =>
      getAgent()
        .app.bsky.feed.getPosts({uris})
        .then(res => res.data.posts),
    ),
  )
  const map = new Map<string, AppBskyFeedDefs.PostView>()
  for (const post of postsChunks.flat()) {
    if (
      AppBskyFeedPost.isRecord(post.record) &&
      AppBskyFeedPost.validateRecord(post.record).success
    ) {
      map.set(post.uri, post)
    }
  }
  return map
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
    notif.reason === 'follow'
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

export function isThreadMuted(notif: FeedNotification, threadMutes: string[]) {
  // If there's a subject we want to use that. This will always work on the notifications tab
  if (notif.subject) {
    const record = notif.subject.record as AppBskyFeedPost.Record
    // Check for a quote record
    if (
      (record.reply && threadMutes.includes(record.reply.root.uri)) ||
      (notif.subject.uri && threadMutes.includes(notif.subject.uri))
    ) {
      return true
    } else if (
      AppBskyEmbedRecord.isMain(record.embed) &&
      threadMutes.includes(record.embed.record.uri)
    ) {
      return true
    }
  } else {
    // Otherwise we just do the best that we can
    const record = notif.notification.record
    if (AppBskyFeedPost.isRecord(record)) {
      if (record.reply && threadMutes.includes(record.reply.root.uri)) {
        // We can always filter replies
        return true
      } else if (
        AppBskyEmbedRecord.isMain(record.embed) &&
        threadMutes.includes(record.embed.record.uri)
      ) {
        // We can also filter quotes if the quoted post is the root
        return true
      }
    } else if (
      AppBskyFeedRepost.isRecord(record) &&
      threadMutes.includes(record.subject.uri)
    ) {
      // Finally we can filter reposts, again if the post is the root
      return true
    }
  }

  return false
}
