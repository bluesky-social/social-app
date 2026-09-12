import {AtUri} from '@atproto/syntax'

import {
  type ActivityPresentationItem,
  buildActivityPresentationListItems,
} from '#/screens/Atmosphere/presentation'
import {
  type ActivityActor,
  type ActivityActors,
  activityCollections,
  type ActivityItem,
  type ActivityView,
  type AssociatedRecord,
  type AssociatedRecords,
} from '#/screens/Atmosphere/types'

export const recordCid =
  'bafyreie5sviu7eeu3vf6n3lrlmqef2vdlwmgzd6zpolov56agdxtshdpda'
export const documentUri = 'at://did:plc:author/site.standard.document/article'
export const publicationUri =
  'at://did:plc:publisher/site.standard.publication/site'

export function createActivity({
  collection = activityCollections.document,
  did = 'did:plc:author',
  rkey = 'article',
  subscribed = false,
  view,
  relatedActivity,
}: {
  collection?: string
  did?: string
  rkey?: string
  subscribed?: boolean
  view?: ActivityView
  relatedActivity?: ActivityItem[]
} = {}): ActivityItem {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#item',
    record: {
      uri: `at://${did}/${collection}/${rkey}`,
      cid: recordCid,
      indexedAt: '2026-09-10T12:00:00.000Z',
    },
    collection,
    viewerState: {subscribed},
    view,
    relatedActivity,
  }
}

export function createActor(did = 'did:plc:author'): ActivityActor {
  return {did, handle: `${did.split(':').at(-1)}.example`}
}

export function createRecord(
  uri: string,
  record: AssociatedRecord['record'],
): AssociatedRecord {
  return {uri, cid: recordCid, record}
}

export function createDocumentRecords(): AssociatedRecords {
  return {
    [documentUri]: createRecord(documentUri, {
      $type: activityCollections.document,
      site: publicationUri,
      title: 'An article',
      publishedAt: '2026-09-10T11:00:00.000Z',
    }),
    [publicationUri]: createRecord(publicationUri, {
      $type: activityCollections.publication,
      name: 'A publication',
      url: 'https://publication.example/',
    }),
  }
}

export function createShareView({
  likeCount = 12,
  replyCount = 34,
  repostCount = 56,
  quoteCount = 78,
  bookmarkCount = 90,
}: {
  likeCount?: number
  replyCount?: number
  repostCount?: number
  quoteCount?: number
  bookmarkCount?: number
} = {}): Extract<
  ActivityView,
  {$type: 'eric.bsky.atmosphere.getActivity#shareView'}
> {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#shareView',
    likeCount,
    replyCount,
    repostCount,
    quoteCount,
    bookmarkCount,
  }
}

export function createShareRecord(
  target = documentUri,
  recordWithMedia = false,
) {
  const external = {
    $type: 'app.bsky.embed.external',
    external: {
      uri: 'https://publication.example/article',
      title: 'An article',
      description: 'An article preview',
      associatedRefs: [{uri: target, cid: recordCid}],
    },
  }
  return {
    $type: activityCollections.share,
    text: 'Some commentary',
    createdAt: '2026-09-10T12:00:00.000Z',
    embed: recordWithMedia
      ? {
          $type: 'app.bsky.embed.recordWithMedia',
          media: external,
          record: {
            $type: 'app.bsky.embed.record',
            record: {
              uri: 'at://did:plc:quoted/app.bsky.feed.post/quote',
              cid: recordCid,
            },
          },
        }
      : external,
  }
}

export function createRow(
  activities: ActivityItem[],
  {
    groupBy = 'subject',
    associatedRecords = {},
    actors = Object.fromEntries(
      activities.map(activity => {
        const did = new AtUri(activity.record.uri).host
        return [did, createActor(did)]
      }),
    ),
  }: {
    groupBy?: 'subject' | 'actor'
    associatedRecords?: AssociatedRecords
    actors?: ActivityActors
  } = {},
): ActivityPresentationItem {
  const first = activities[0]
  return activities.length === 1
    ? {
        type: 'activity',
        key: first.record.uri,
        activity: first,
        associatedRecords,
        actors,
      }
    : {
        type: 'group',
        key: 'group',
        group: {
          $type: 'eric.bsky.atmosphere.getActivity#group',
          id: 'group',
          collection: first.collection,
          groupBy,
          actor:
            groupBy === 'actor' ? new AtUri(first.record.uri).host : undefined,
          subject: groupBy === 'subject' ? documentUri : undefined,
          indexedAt: first.record.indexedAt,
          items: activities,
        },
        associatedRecords,
        actors,
      }
}

export function present(item: ActivityPresentationItem) {
  return {
    item,
    computedItemView: buildActivityPresentationListItems([item])[0]
      .computedItemView ?? {actors: []},
  }
}
