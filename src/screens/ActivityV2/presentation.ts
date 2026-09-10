import {AtUri} from '@atproto/syntax'

import {makeProfileLink} from '#/lib/routes/links'
import {isInvalidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {type app} from '#/lexicons'
import type * as bsky from '#/types/bsky'
import {
  createDocumentExternalView,
  createPublicationExternalView,
  getPublicationBodyThemeColors,
  type PublicationBodyThemeColors,
} from './externalViews'
import {
  type ActivityGroupRowItem,
  type ActivityListItem,
  type ActivityRowItem,
} from './model'
import {
  type ActivityActor,
  activityCollections,
  type ActivityItem,
  type AssociatedRecords,
  isDocumentRecord,
  isPublicationRecord,
  isRecommendRecord,
  isSubscriptionRecord,
} from './types'

const MAX_ACTIVITY_HEADER_AVATARS = 5

export type ActivityPresentationItem = ActivityRowItem | ActivityGroupRowItem

export type ActivityComputedActor = {
  did: string
  handle: string
  label: string
  href: string
}

export type ResolvedActivityActor = ActivityComputedActor & {
  profile: bsky.profile.AnyProfileView
}

export type ResolvedActivityActors = {
  primary: ResolvedActivityActor
  profiles: bsky.profile.AnyProfileView[]
  othersCount: number
  usableActors: ResolvedActivityActor[]
}

export type ActivityComputedRoot = {
  uri: string
  collection: string
  indexedAt: string
  isSubscribed: boolean
}

export type ActivityComputedBody =
  | {
      kind: 'article-embeds'
      views: app.bsky.embed.external.ViewExternal[]
    }
  | {
      kind: 'publication-card'
      view: app.bsky.embed.external.ViewExternal
      themeColors: PublicationBodyThemeColors | undefined
    }

export type ActivityComputedView = {
  rootCollection: string
  timestamp: string
  actorPresentation: ResolvedActivityActors
  group: {
    kind: 'standalone' | 'actor' | 'subject'
    count: number
  }
  roots: ActivityComputedRoot[]
  subscriptionState: 'all' | 'some' | 'none'
  body: ActivityComputedBody | undefined
  relationships: {
    recommendation?: {
      document?: {
        uri: string
        title?: string
        url?: string
        author?: ActivityComputedActor
      }
    }
    subscription?: {
      publication?: {
        uri: string
        name?: string
        url?: string
      }
    }
  }
}

export type ActivityPresentationListItem = {
  item: ActivityListItem
  computedItemView: ActivityComputedView | undefined
}

export type ActivityPresentationProps = {
  item: ActivityListItem
  computedItemView: ActivityComputedView
}

export function buildActivityPresentationListItems(
  items: ActivityListItem[],
): ActivityPresentationListItem[] {
  return buildPresentationListItems(items)
}

function buildPresentationListItems(
  items: ActivityListItem[],
): ActivityPresentationListItem[] {
  const firstItem = items[0]
  if (!firstItem) {
    return [{item: {type: 'empty', key: 'empty'}, computedItemView: undefined}]
  }

  if (!isPresentationItem(firstItem)) {
    return [{item: firstItem, computedItemView: undefined}]
  }

  const presentationItems: ActivityPresentationListItem[] = []
  for (const item of items) {
    if (!isPresentationItem(item)) {
      presentationItems.push({item, computedItemView: undefined})
      continue
    }

    const computedItemView = buildActivityComputedView(item)
    if (computedItemView) {
      presentationItems.push({item, computedItemView})
    }
  }

  return presentationItems.length > 0
    ? presentationItems
    : [{item: {type: 'empty', key: 'empty'}, computedItemView: undefined}]
}

function buildActivityComputedView(
  item: ActivityPresentationItem,
): ActivityComputedView | undefined {
  const actorPresentation = resolveActivityActors(item)
  if (!actorPresentation) {
    return undefined
  }

  const roots = getComputedRoots(item)
  const rootCollection = getRootCollection(item)

  return {
    rootCollection,
    timestamp: getActivityTimestamp(item),
    actorPresentation,
    group:
      item.type === 'activity'
        ? {kind: 'standalone', count: 1}
        : {kind: item.group.groupBy, count: item.group.items.length},
    roots,
    subscriptionState: getSubscriptionState(roots),
    body: buildActivityComputedBody(item, rootCollection, roots),
    relationships: {
      recommendation:
        rootCollection === activityCollections.recommendation
          ? buildRecommendationRelationship(item)
          : undefined,
      subscription:
        rootCollection === activityCollections.subscription
          ? buildSubscriptionRelationship(item)
          : undefined,
    },
  }
}

function buildActivityComputedBody(
  item: ActivityPresentationItem,
  rootCollection: string,
  roots: ActivityComputedRoot[],
): ActivityComputedBody | undefined {
  if (rootCollection === activityCollections.document) {
    return buildDocumentBody(item, roots)
  }

  if (rootCollection === activityCollections.publication) {
    return buildPublicationBody(
      getPublicationBodyCandidateUris(item),
      item.associatedRecords,
      item.actors,
    )
  }

  if (rootCollection === activityCollections.subscription) {
    return buildPublicationBody(
      getSubscriptionBodyCandidateUris(item),
      item.associatedRecords,
      item.actors,
    )
  }

  return undefined
}

function buildDocumentBody(
  item: ActivityPresentationItem,
  roots: ActivityComputedRoot[],
): ActivityComputedBody | undefined {
  if (!roots.every(root => root.isSubscribed)) {
    return undefined
  }

  const views = getRootActivityUris(item).flatMap(uri => {
    const view = createDocumentExternalView({
      uri,
      associatedRecords: item.associatedRecords,
      actors: item.actors,
    })
    return view ? [view] : []
  })

  return views.length > 0 ? {kind: 'article-embeds', views} : undefined
}

function buildPublicationBody(
  uris: Array<string | undefined>,
  associatedRecords: AssociatedRecords,
  actors: ActivityPresentationItem['actors'],
): ActivityComputedBody | undefined {
  for (const uri of uris) {
    const view = createPublicationExternalView({uri, associatedRecords, actors})
    if (view) {
      return {
        kind: 'publication-card',
        view,
        themeColors: getPublicationBodyThemeColors(view),
      }
    }
  }

  return undefined
}

function getRootActivityUris(item: ActivityPresentationItem) {
  return item.type === 'activity'
    ? [item.activity.record.uri]
    : item.group.items.map(activity => activity.record.uri)
}

function getPublicationBodyCandidateUris(item: ActivityPresentationItem) {
  return getRootActivityUris(item)
}

function getSubscriptionBodyCandidateUris(item: ActivityPresentationItem) {
  return item.type === 'activity'
    ? [
        getSubscriptionPublicationUriForActivity(
          item.activity,
          item.associatedRecords,
        ),
      ]
    : item.group.items.map(activity =>
        getSubscriptionPublicationUriForActivity(
          activity,
          item.associatedRecords,
        ),
      )
}

function buildRecommendationRelationship(item: ActivityPresentationItem) {
  const documentUri = getRecommendationDocumentUri(item)
  if (!documentUri) return undefined

  return {
    document: {
      uri: documentUri,
      title: getDocumentTitle(item, documentUri),
      url: getDocumentUrl(item, documentUri),
      author: getDocumentAuthor(item, documentUri),
    },
  }
}

function buildSubscriptionRelationship(item: ActivityPresentationItem) {
  const publicationUri = getSubscriptionPublicationUri(item)
  if (!publicationUri) return undefined

  const publicationRecord = item.associatedRecords[publicationUri]?.record
  if (!isPublicationRecord(publicationRecord)) {
    return {publication: {uri: publicationUri}}
  }

  const name = publicationRecord.name.trim() || undefined
  return {
    publication: {
      uri: publicationUri,
      name,
      url: getWebUrl(publicationRecord.url),
    },
  }
}

function getComputedRoots(
  item: ActivityPresentationItem,
): ActivityComputedRoot[] {
  if (item.type === 'activity') {
    return [toComputedRoot(item.activity)]
  }

  return item.group.items.map(toComputedRoot)
}

function toComputedRoot(activity: ActivityItem): ActivityComputedRoot {
  return {
    uri: activity.record.uri,
    collection: activity.collection,
    indexedAt: activity.record.indexedAt,
    isSubscribed: activity.viewerState.subscribed,
  }
}

function getSubscriptionState(roots: ActivityComputedRoot[]) {
  const subscribedCount = roots.filter(root => root.isSubscribed).length
  if (subscribedCount === 0) return 'none'
  if (subscribedCount === roots.length) return 'all'
  return 'some'
}

function getRootCollection(item: ActivityPresentationItem): string {
  return item.type === 'activity'
    ? item.activity.collection
    : item.group.collection
}

function getActivityTimestamp(item: ActivityPresentationItem): string {
  return item.type === 'activity'
    ? item.activity.record.indexedAt
    : item.group.indexedAt
}

function buildActorPresentation(actor: ActivityActor): ResolvedActivityActor {
  return {
    did: actor.did,
    handle: actor.handle,
    label: sanitizeHandle(actor.handle, '@'),
    href: makeProfileLink({did: actor.did, handle: actor.handle}),
    profile: asProfileViewBasic(actor),
  }
}

function resolveActivityActors(
  item: ActivityPresentationItem,
): ResolvedActivityActors | undefined {
  const usableActors = getCandidateActorDids(item).flatMap(did => {
    const actor = item.actors[did]
    return isUsableActivityActor(actor) ? [buildActorPresentation(actor)] : []
  })

  if (usableActors.length === 0) {
    return undefined
  }

  return {
    primary: usableActors[0],
    profiles: usableActors
      .slice(0, MAX_ACTIVITY_HEADER_AVATARS)
      .map(actor => actor.profile),
    othersCount:
      item.type === 'group' && item.group.groupBy === 'subject'
        ? Math.max(0, usableActors.length - 1)
        : 0,
    usableActors,
  }
}

function getCandidateActorDids(item: ActivityPresentationItem): string[] {
  if (item.type === 'activity') {
    return dedupeDefined([tryGetAuthorityDid(item.activity.record.uri)])
  }

  if (item.group.groupBy === 'actor') {
    const groupActorDid = isDid(item.group.actor)
      ? item.group.actor
      : tryGetAuthorityDid(item.group.items[0]?.record.uri)

    return dedupeDefined([groupActorDid])
  }

  return dedupeDefined(
    item.group.items.map(activity => tryGetAuthorityDid(activity.record.uri)),
  )
}

function getRecommendationDocumentUri(item: ActivityPresentationItem) {
  if (item.type === 'group' && item.group.groupBy === 'subject') {
    return item.group.subject
  }

  if (item.type !== 'activity') {
    return undefined
  }

  const recommendationRecord =
    item.associatedRecords[item.activity.record.uri]?.record
  return isRecommendRecord(recommendationRecord)
    ? recommendationRecord.document
    : undefined
}

function getSubscriptionPublicationUri(item: ActivityPresentationItem) {
  if (item.type === 'group' && item.group.groupBy === 'subject') {
    return item.group.subject
  }

  if (item.type !== 'activity') {
    return undefined
  }

  return getSubscriptionPublicationUriForActivity(
    item.activity,
    item.associatedRecords,
  )
}

function getSubscriptionPublicationUriForActivity(
  activity: ActivityItem,
  associatedRecords: AssociatedRecords,
) {
  const subscriptionRecord = associatedRecords[activity.record.uri]?.record
  return isSubscriptionRecord(subscriptionRecord)
    ? subscriptionRecord.publication
    : undefined
}

function getDocumentTitle(
  item: ActivityPresentationItem,
  documentUri: string | undefined,
) {
  if (!documentUri) return undefined

  const documentRecord = item.associatedRecords[documentUri]?.record
  if (!isDocumentRecord(documentRecord)) return undefined

  return documentRecord.title.trim() || undefined
}

function getDocumentAuthor(
  item: ActivityPresentationItem,
  documentUri: string | undefined,
): ActivityComputedActor | undefined {
  const documentAuthorDid = tryGetAuthorityDid(documentUri)
  if (!documentAuthorDid) return undefined

  const documentAuthor = item.actors[documentAuthorDid]
  return isUsableActivityActor(documentAuthor)
    ? buildActorPresentation(documentAuthor)
    : undefined
}

function getDocumentUrl(
  item: ActivityPresentationItem,
  documentUri: string | undefined,
) {
  if (!documentUri) return undefined

  const documentRecord = item.associatedRecords[documentUri]?.record
  if (!isDocumentRecord(documentRecord)) return undefined

  const site =
    typeof documentRecord.site === 'string' ? documentRecord.site : undefined
  if (!site) return undefined

  const publicationRecord = site.startsWith('at://')
    ? item.associatedRecords[site]?.record
    : undefined
  const baseUrl = site.startsWith('at://')
    ? getWebUrl(publicationRecord?.url)
    : getWebUrl(site)
  if (!baseUrl) return undefined

  const path =
    typeof documentRecord.path === 'string' ? documentRecord.path : ''
  try {
    return getWebUrl(new URL(path, ensureTrailingSlash(baseUrl)).href)
  } catch {
    return undefined
  }
}

function getWebUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`
}

function tryGetAuthorityDid(uri: string | undefined): string | undefined {
  if (!uri) return undefined

  try {
    return new AtUri(uri).host
  } catch {
    return undefined
  }
}

function dedupeDefined(values: Array<string | undefined>): string[] {
  const seen = new Set<string>()
  const deduped: string[] = []

  for (const value of values) {
    if (!value || seen.has(value)) continue
    seen.add(value)
    deduped.push(value)
  }

  return deduped
}

function isPresentationItem(
  item: ActivityListItem,
): item is ActivityPresentationItem {
  return item.type === 'activity' || item.type === 'group'
}

function isUsableActivityActor(
  actor: ActivityActor | undefined,
): actor is ActivityActor {
  return Boolean(actor?.did && actor.handle && !isInvalidHandle(actor.handle))
}

function asProfileViewBasic(actor: ActivityActor): bsky.profile.AnyProfileView {
  return {
    did: actor.did,
    handle: actor.handle,
    displayName: actor.displayName,
    avatar: actor.avatar,
    associated: undefined,
    labels: [],
    viewer: undefined,
    createdAt: actor.createdAt,
  } as app.bsky.actor.defs.ProfileViewBasic
}

function isDid(value: string | undefined): value is string {
  return Boolean(value?.startsWith('did:'))
}
