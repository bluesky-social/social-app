import {type InfiniteData} from '@tanstack/react-query'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  type ActivityActors,
  type ActivityGroup,
  type ActivityItem,
  type AtmosphereActivityPage,
} from './types'

export type ActivityRowItem = {
  type: 'activity'
  key: string
  activity: ActivityItem
  actors: ActivityActors
}

export type ActivityGroupRowItem = {
  type: 'group'
  key: string
  group: ActivityGroup
  /** Original API group when display deduplication removes members. */
  rawGroup?: ActivityGroup
  actors: ActivityActors
}

export type ActivityListItem =
  | ActivityRowItem
  | ActivityGroupRowItem
  | {type: 'loading'; key: 'loading'}
  | {type: 'empty'; key: 'empty'}
  | {type: 'error'; key: 'error'; error: string}

export function buildActivityListItems(
  data: InfiniteData<AtmosphereActivityPage> | undefined,
  error?: string,
): ActivityListItem[] {
  if (!data) {
    return error
      ? [{type: 'error', key: 'error', error}]
      : [{type: 'loading', key: 'loading'}]
  }

  const seen = new Set<string>()
  const items: ActivityListItem[] = []
  const schema = app.bsky.unspecced.getAtmosphereTimeline
  for (const page of data.pages) {
    for (const entry of page.feed) {
      if (bsky.isType(schema.activityActorGroup, entry)) {
        // Only this member is hydrated. Never promote an unhydrated URI.
        if (seen.has(entry.item.record.uri)) continue
        const uris = entry.uris.filter(uri => {
          if (seen.has(uri)) return false
          seen.add(uri)
          return true
        })
        if (uris.length === 0 || !uris.includes(entry.item.record.uri)) continue
        items.push({
          type: 'group',
          key: entry.id,
          group: uris.length === entry.uris.length ? entry : {...entry, uris},
          rawGroup: uris.length === entry.uris.length ? undefined : entry,
          actors: page.actors,
        })
      } else if (bsky.isType(schema.activitySubjectGroup, entry)) {
        const activities = entry.activities.filter(activity => {
          if (seen.has(activity.record.uri)) return false
          seen.add(activity.record.uri)
          return true
        })
        if (activities.length === 0) continue
        const changed = activities.length !== entry.activities.length
        const actors = changed
          ? entry.actors.filter(actor =>
              activities.some(activity =>
                activity.record.uri.startsWith(`at://${actor.did}/`),
              ),
            )
          : entry.actors
        items.push({
          type: 'group',
          key: entry.id,
          group: changed ? {...entry, activities, actors} : entry,
          rawGroup: changed ? entry : undefined,
          actors: page.actors,
        })
      } else if (bsky.isType(schema.activityItem, entry)) {
        if (seen.has(entry.record.uri)) continue
        seen.add(entry.record.uri)
        items.push({
          type: 'activity',
          key: entry.record.uri,
          activity: entry,
          actors: page.actors,
        })
      }
    }
  }

  return items.length > 0 ? items : [{type: 'empty', key: 'empty'}]
}
