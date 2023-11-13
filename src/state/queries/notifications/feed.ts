import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyFeedLike,
  AppBskyNotificationListNotifications,
  BskyAgent,
} from '@atproto/api'
import chunk from 'lodash.chunk'
import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'
import {useSession} from '../../session'
import {useModerationOpts} from '../preferences'
import {shouldFilterNotif} from './util'
import {useMutedThreads} from '#/state/muted-threads'

const GROUPABLE_REASONS = ['like', 'repost', 'follow']
const PAGE_SIZE = 30
const MS_1HR = 1e3 * 60 * 60
const MS_2DAY = MS_1HR * 48

type RQPageParam = string | undefined
type NotificationType =
  | 'post-like'
  | 'feedgen-like'
  | 'repost'
  | 'mention'
  | 'reply'
  | 'quote'
  | 'follow'
  | 'unknown'

export function RQKEY() {
  return ['notification-feed']
}

export interface FeedNotification {
  _reactKey: string
  type: NotificationType
  notification: AppBskyNotificationListNotifications.Notification
  additional?: AppBskyNotificationListNotifications.Notification[]
  subjectUri?: string
  subject?: AppBskyFeedDefs.PostView
}

export interface FeedPage {
  cursor: string | undefined
  items: FeedNotification[]
}

export function useNotificationFeedQuery(opts?: {enabled?: boolean}) {
  const {agent} = useSession()
  const moderationOpts = useModerationOpts()
  const threadMutes = useMutedThreads()
  const enabled = opts?.enabled !== false

  return useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.listNotifications({
        limit: PAGE_SIZE,
        cursor: pageParam,
      })

      // filter out notifs by mod rules
      const notifs = res.data.notifications.filter(
        notif => !shouldFilterNotif(notif, moderationOpts),
      )

      // group notifications which are essentially similar (follows, likes on a post)
      let notifsGrouped = groupNotifications(notifs)

      // we fetch subjects of notifications (usually posts) now instead of lazily
      // in the UI to avoid relayouts
      const subjects = await fetchSubjects(agent, notifsGrouped)
      for (const notif of notifsGrouped) {
        if (notif.subjectUri) {
          notif.subject = subjects.get(notif.subjectUri)
        }
      }

      // apply thread muting
      notifsGrouped = notifsGrouped.filter(
        notif => !isThreadMuted(notif, threadMutes),
      )

      return {
        cursor: res.data.cursor,
        items: notifsGrouped,
      }
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled,
  })
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
  agent: BskyAgent,
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
      agent.app.bsky.feed.getPosts({uris}).then(res => res.data.posts),
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
