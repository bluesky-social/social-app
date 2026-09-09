import {AtUri} from '@atproto/syntax'

import {isInvalidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {type app} from '#/lexicons'
import type * as bsky from '#/types/bsky'
import {
  type ActivityGroupRowItem,
  type ActivityListItem,
  type ActivityRowItem,
} from './model'
import {type ActivityActor, type ActivityGroup} from './types'

const MAX_ACTIVITY_HEADER_AVATARS = 5

export type ActivityPresentationItem = ActivityRowItem | ActivityGroupRowItem

export type ResolvedActivityActor = {
  did: string
  handle: string
  label: string
  profile: bsky.profile.AnyProfileView
}

export type ResolvedActivityActors = {
  primary: ResolvedActivityActor
  profiles: bsky.profile.AnyProfileView[]
  othersCount: number
  usableActors: ResolvedActivityActor[]
}

export type PresentableActivityRowItem = ActivityPresentationItem & {
  actorPresentation: ResolvedActivityActors
}

export type ActivityPresentationListItem =
  | PresentableActivityRowItem
  | {type: 'loading'; key: 'loading'}
  | {type: 'empty'; key: 'empty'}
  | {type: 'error'; key: 'error'; error: string}

export function buildActivityPresentationListItems(
  items: ActivityListItem[],
): ActivityPresentationListItem[] {
  const firstItem = items[0]
  if (!firstItem) {
    return [{type: 'empty', key: 'empty'}]
  }

  if (
    firstItem.type === 'loading' ||
    firstItem.type === 'empty' ||
    firstItem.type === 'error'
  ) {
    return [firstItem]
  }

  const presentableItems = items.flatMap(item => {
    if (item.type !== 'activity' && item.type !== 'group') {
      return []
    }

    const actorPresentation = resolveActivityActors(item)
    return actorPresentation ? [{...item, actorPresentation}] : []
  })

  return presentableItems.length > 0
    ? presentableItems
    : [{type: 'empty', key: 'empty'}]
}

export function getActivityCollection(item: ActivityPresentationItem): string {
  return item.type === 'activity'
    ? item.activity.collection
    : item.group.collection
}

export function isActivityActorGroupItem(
  item: ActivityPresentationItem,
): item is ActivityGroupRowItem & {group: ActivityGroup & {groupBy: 'actor'}} {
  return item.type === 'group' && item.group.groupBy === 'actor'
}

export function isActivitySubjectGroupItem(
  item: ActivityPresentationItem,
): item is ActivityGroupRowItem & {
  group: ActivityGroup & {groupBy: 'subject'}
} {
  return item.type === 'group' && item.group.groupBy === 'subject'
}

export function resolveActivityActors(
  item: ActivityPresentationItem,
): ResolvedActivityActors | undefined {
  const usableActors = getCandidateActorDids(item).flatMap(did => {
    const actor = item.actors[did]
    return isUsableActivityActor(actor)
      ? [
          {
            did: actor.did,
            handle: actor.handle,
            label: sanitizeHandle(actor.handle, '@'),
            profile: asProfileViewBasic(actor),
          },
        ]
      : []
  })

  if (usableActors.length === 0) {
    return undefined
  }

  return {
    primary: usableActors[0],
    profiles: usableActors
      .slice(0, MAX_ACTIVITY_HEADER_AVATARS)
      .map(actor => actor.profile),
    othersCount: isActivitySubjectGroupItem(item)
      ? Math.max(0, usableActors.length - 1)
      : 0,
    usableActors,
  }
}

export function tryGetAuthorityDid(
  uri: string | undefined,
): string | undefined {
  if (!uri) return undefined

  try {
    return new AtUri(uri).host
  } catch {
    return undefined
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

export function isUsableActivityActor(
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
