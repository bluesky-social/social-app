import {AtUri, isValidDid} from '@atproto/syntax'

import {getArticleExternalView} from '#/screens/Atmosphere/externalViews'
import {
  type ActivityPresentationItem,
  buildActivityPresentationListItems,
} from '#/screens/Atmosphere/presentation'
import {
  type ActivityActor,
  type ActivityActorGroup,
  type ActivityActors,
  activityCollections,
  type ActivityGroupItem,
  type ActivityItem,
  type ActivityRelatedGroup,
  type ActivitySubject,
  type ActivitySubjectGroup,
  type ActivityView,
} from '#/screens/Atmosphere/types'
import {type app} from '#/lexicons'

type Typed<T extends {$type?: string}> = T & {$type: NonNullable<T['$type']>}

export const recordCid =
  'bafyreie5sviu7eeu3vf6n3lrlmqef2vdlwmgzd6zpolov56agdxtshdpda'
export const documentUri = 'at://did:plc:author/site.standard.document/article'
export const publicationUri =
  'at://did:plc:publisher/site.standard.publication/site'

export function createActor(
  did: ActivityActor['did'] = 'did:plc:author',
): ActivityActor {
  return {did, handle: `${did.split(':').at(-1)}.example`}
}

export function createPublicationView(
  overrides: Partial<app.bsky.embed.external.ViewArticlePublication> = {},
): Typed<app.bsky.embed.external.ViewArticlePublication> {
  return {
    $type: 'app.bsky.embed.external#viewArticlePublication',
    uri: 'https://publication.example/',
    title: 'A publication',
    description: 'A publication description',
    logo: 'https://publication.example/logo.png',
    associatedRefs: [{uri: publicationUri, cid: recordCid}],
    associatedProfiles: [createActor('did:plc:publisher')],
    ...overrides,
  }
}

export function createArticleView(
  overrides: Partial<app.bsky.embed.external.ViewArticle> = {},
): Typed<app.bsky.embed.external.ViewArticle> {
  return {
    $type: 'app.bsky.embed.external#viewArticle',
    uri: 'https://publication.example/article',
    title: 'An article',
    description: 'An article preview',
    image: 'https://publication.example/article.png',
    createdAt: '2026-09-10T11:00:00.000Z',
    publisher: createPublicationView(),
    associatedRefs: [{uri: documentUri, cid: recordCid}],
    associatedProfiles: [createActor()],
    ...overrides,
  }
}

export function createGalleryView(
  overrides: Partial<app.bsky.embed.external.ViewGallery> = {},
): Typed<app.bsky.embed.external.ViewGallery> {
  return {
    $type: 'app.bsky.embed.external#viewGallery',
    uri: 'https://grain.social/gallery/example',
    title: 'A gallery',
    description: 'A gallery description',
    items: [
      {
        $type: 'app.bsky.embed.external#viewGalleryImage',
        thumbnail: 'https://grain.social/photo-thumb.jpg',
        fullsize: 'https://grain.social/photo-full.jpg',
        alt: 'A photo',
        aspectRatio: {width: 3, height: 2},
      },
    ],
    associatedProfiles: [createActor()],
    ...overrides,
  }
}

export function createLivestreamView(
  overrides: Partial<app.bsky.embed.external.ViewLivestream> = {},
): Typed<app.bsky.embed.external.ViewLivestream> {
  return {
    $type: 'app.bsky.embed.external#viewLivestream',
    uri: 'https://stream.place/author',
    title: 'A livestream',
    description: 'A livestream description',
    active: true,
    image: 'https://stream.place/author/thumb.jpg',
    createdAt: '2026-09-10T10:00:00.000Z',
    startedAt: '2026-09-10T11:00:00.000Z',
    associatedProfiles: [createActor()],
    ...overrides,
  }
}

export function createShareRecord(
  target: ActivityItem['record']['uri'] = documentUri,
  recordWithMedia = false,
): Typed<app.bsky.feed.post.Main> {
  const external: Typed<app.bsky.embed.external.Main> = {
    $type: 'app.bsky.embed.external',
    external: {
      uri: 'https://publication.example/article',
      title: 'An article',
      description: 'An article preview',
      associatedRefs: [{uri: target, cid: recordCid}],
    },
  }
  return {
    $type: 'app.bsky.feed.post',
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

export function createPostView(
  overrides: Partial<app.bsky.feed.defs.PostView> = {},
): Typed<app.bsky.feed.defs.PostView> {
  return {
    $type: 'app.bsky.feed.defs#postView',
    uri: 'at://did:plc:sharer/app.bsky.feed.post/share',
    cid: recordCid,
    author: createActor('did:plc:sharer'),
    record: createShareRecord(),
    indexedAt: '2026-09-10T12:00:00.000Z',
    likeCount: 12,
    replyCount: 34,
    repostCount: 56,
    quoteCount: 78,
    bookmarkCount: 90,
    embed: {
      $type: 'app.bsky.embed.external#view',
      external: {
        $type: 'app.bsky.embed.external#viewExternal',
        uri: 'https://publication.example/article',
        title: 'An article',
        description: 'An article preview',
        associatedRefs: [{uri: documentUri, cid: recordCid}],
        associatedProfiles: [createActor()],
      },
    },
    ...overrides,
  }
}

export function createActivity({
  collection = activityCollections.document,
  did = 'did:plc:author',
  rkey = 'article',
  subscribed = false,
  view = collection === activityCollections.document
    ? createArticleView()
    : undefined,
  relatedActivity,
  bskyPostRef,
  viewBskyPost,
}: {
  collection?: ActivityItem['collection']
  did?: ActivityActor['did']
  rkey?: string
  subscribed?: boolean
  view?: ActivityView
  relatedActivity?: ActivityRelatedGroup[]
  bskyPostRef?: ActivityItem['bskyPostRef']
  viewBskyPost?: ActivityItem['viewBskyPost']
} = {}): Typed<ActivityItem> {
  return {
    $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityItem',
    record: {
      uri: `at://${did}/${collection}/${rkey}`,
      cid: recordCid,
      indexedAt: '2026-09-10T12:00:00.000Z',
    },
    collection,
    viewerState: {subscribed},
    view,
    relatedActivity,
    bskyPostRef,
    viewBskyPost,
  }
}

export function createRelatedGroup(
  activities: ActivityItem[],
  actors = getFixtureActors(activities),
): Typed<ActivityRelatedGroup> {
  return {
    $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityRelatedGroup',
    collection: activities[0].collection,
    activities: activities.map(toGroupItem),
    actors,
  }
}

export function createActorGroup(
  activities: ActivityItem[],
): Typed<ActivityActorGroup> {
  const item = activities[0]
  return {
    $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityActorGroup',
    id: 'group',
    collection: item.collection,
    indexedAt: item.record.indexedAt,
    actor: getOwnerDid(item.record.uri),
    item,
    uris: activities.map(activity => activity.record.uri),
  }
}

export function createSubjectGroup(
  activities: ActivityItem[],
  subject: ActivitySubject['uri'] | ActivitySubject = activities[0]
    .collection === activityCollections.subscription
    ? publicationUri
    : documentUri,
  actors = getFixtureActors(activities),
): Typed<ActivitySubjectGroup> {
  const first = activities[0]
  const external = getArticleExternalView(first)
  // Missing views remain deliberately malformed test input, not valid fallbacks.
  const view =
    first.collection === activityCollections.share && external
      ? {...external, $type: 'app.bsky.embed.external#viewArticle' as const}
      : (first.view as ActivitySubject['view'])
  return {
    $type: 'app.bsky.unspecced.getAtmosphereTimeline#activitySubjectGroup',
    id: 'group',
    collection: first.collection,
    indexedAt: first.record.indexedAt,
    subject:
      typeof subject === 'string'
        ? {
            uri: subject,
            viewerState: first.viewerState,
            view,
            bskyPostRef: first.bskyPostRef,
            viewBskyPost: first.viewBskyPost,
          }
        : subject,
    activities: activities.map(toGroupItem),
    actors,
  }
}

export function createRow(
  activities: ActivityItem[],
  {
    groupBy = 'subject',
    subject,
    actors = Object.fromEntries(
      getFixtureActors(activities).map(actor => [actor.did, actor]),
    ),
  }: {
    groupBy?: 'subject' | 'actor'
    subject?: ActivitySubject['uri'] | ActivitySubject
    actors?: ActivityActors
  } = {},
) {
  const first = activities[0]
  if (!first) throw new Error('Expected at least one activity fixture')
  return activities.length === 1
    ? {
        type: 'activity' as const,
        key: first.record.uri,
        activity: first,
        actors,
      }
    : {
        type: 'group' as const,
        key: 'group',
        group:
          groupBy === 'actor'
            ? createActorGroup(activities)
            : createSubjectGroup(
                activities,
                subject,
                getFixtureActors(activities).flatMap(actor =>
                  actors[actor.did] ? [actors[actor.did]] : [],
                ),
              ),
        actors,
      }
}

function toGroupItem(activity: ActivityItem): ActivityGroupItem {
  return {record: activity.record, collection: activity.collection}
}

function getFixtureActors(activities: ActivityItem[]): ActivityActor[] {
  const seen = new Set<string>()
  return activities.flatMap(activity => {
    const did = getOwnerDid(activity.record.uri)
    if (seen.has(did)) return []
    seen.add(did)
    return [createActor(did)]
  })
}

function getOwnerDid(uri: ActivityItem['record']['uri']): ActivityActor['did'] {
  const did = new AtUri(uri).host
  if (!isValidDid(did)) throw new Error('Expected a DID-owned activity fixture')
  return did
}

export function present(item: ActivityPresentationItem) {
  return {
    item,
    computedItemView: buildActivityPresentationListItems([item])[0]
      .computedItemView ?? {actors: []},
  }
}
