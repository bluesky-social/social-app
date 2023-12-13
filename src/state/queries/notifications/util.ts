import {
  AppBskyNotificationListNotifications,
  ModerationOpts,
  moderateProfile,
  moderatePost,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyFeedLike,
} from '@atproto/api'
import chunk from 'lodash.chunk'
import {QueryClient} from '@tanstack/react-query'
import {getAgent} from '../../session'
import {precacheProfile as precacheResolvedUri} from '../resolve-uri'
import {NotificationType, FeedNotification, FeedPage} from './types'

const GROUPABLE_REASONS = ['like', 'repost', 'follow']
const MS_1HR = 1e3 * 60 * 60
const MS_2DAY = MS_1HR * 48

// exported api
// =

export async function fetchPage({
  cursor,
  limit,
  queryClient,
  moderationOpts,
  threadMutes,
  fetchAdditionalData,
}: {
  cursor: string | undefined
  limit: number
  queryClient: QueryClient
  moderationOpts: ModerationOpts | undefined
  threadMutes: string[]
  fetchAdditionalData: boolean
}): Promise<FeedPage> {
  const res = await getAgent().listNotifications({
    limit,
    cursor,
  })

  // filter out notifs by mod rules
  const notifs = res.data.notifications.filter(
    notif => !shouldFilterNotif(notif, moderationOpts),
  )

  // group notifications which are essentially similar (follows, likes on a post)
  let notifsGrouped = groupNotifications(notifs)

  // we fetch subjects of notifications (usually posts) now instead of lazily
  // in the UI to avoid relayouts
  if (fetchAdditionalData) {
    const subjects = await fetchSubjects(notifsGrouped)
    for (const notif of notifsGrouped) {
      if (notif.subjectUri) {
        notif.subject = subjects.get(notif.subjectUri)
        if (notif.subject) {
          precacheResolvedUri(queryClient, notif.subject.author) // precache the handle->did resolution
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
    cursor: res.data.cursor,
    seenAt,
    items: notifsGrouped,
  }
}

// internal methods
// =

// TODO this should be in the sdk as moderateNotification -prf
function shouldFilterNotif(
  notif: AppBskyNotificationListNotifications.Notification,
  moderationOpts: ModerationOpts | undefined,
): boolean {
  if (!moderationOpts) {
    return false
  }
  const profile = moderateProfile(notif.author, moderationOpts)
  if (
    profile.account.filter ||
    profile.profile.filter ||
    notif.author.viewer?.muted
  ) {
    return true
  }
  if (
    notif.type === 'reply' ||
    notif.type === 'quote' ||
    notif.type === 'mention'
  ) {
    // NOTE: the notification overlaps the post enough for this to work
    const post = moderatePost(notif, moderationOpts)
    if (post.content.filter) {
      return true
    }
  }
  // TODO: thread muting is not being applied
  // (this requires fetching the post)
  return false
}

function groupNotifications(
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
  groupedNotifs: FeedNotification[],
): Promise<Map<string, AppBskyFeedDefs.PostView>> {
  const uris = new Set<string>()
  for (const notif of groupedNotifs) {
    if (notif.subjectUri) {
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
  }
}

function isThreadMuted(notif: FeedNotification, mutes: string[]): boolean {
  if (!notif.subject) {
    return false
  }
  const record = notif.subject.record as AppBskyFeedPost.Record // assured in fetchSubjects()
  return mutes.includes(record.reply?.root.uri || notif.subject.uri)
}
