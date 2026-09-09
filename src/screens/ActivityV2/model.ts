import {type InfiniteData} from '@tanstack/react-query'

import {
  type ActivityActors,
  type ActivityGroup,
  type ActivityItem,
  type AssociatedRecords,
  type AtmosphereActivityPage,
} from './types'

export type ActivityRowItem = {
  type: 'activity'
  key: string
  activity: ActivityItem
  associatedRecords: AssociatedRecords
  actors: ActivityActors
}

export type ActivityGroupRowItem = {
  type: 'group'
  key: string
  group: ActivityGroup
  associatedRecords: AssociatedRecords
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

  const associatedRecords: AssociatedRecords = {}
  const actors: ActivityActors = {}
  for (const page of data.pages) {
    Object.assign(associatedRecords, page.associatedRecords)
    Object.assign(actors, page.actors)
  }

  const seen = new Set<string>()
  const items: Array<ActivityRowItem | ActivityGroupRowItem> = []
  for (const page of data.pages) {
    for (const entry of page.feed) {
      if (entry.$type === 'eric.bsky.atmosphere.getActivity#group') {
        const groupItems = entry.items.filter(item => {
          if (seen.has(item.record.uri)) return false
          seen.add(item.record.uri)
          return true
        })
        if (groupItems.length === 0) continue
        if (
          groupItems.length === 1 &&
          !(
            entry.groupBy === 'actor' &&
            entry.collection === 'site.standard.graph.recommend'
          )
        ) {
          items.push({
            type: 'activity',
            key: groupItems[0].record.uri,
            activity: groupItems[0],
            associatedRecords,
            actors,
          })
          continue
        }
        items.push({
          type: 'group',
          key: entry.id,
          group: {...entry, items: groupItems},
          associatedRecords,
          actors,
        })
      } else {
        if (seen.has(entry.record.uri)) continue
        seen.add(entry.record.uri)
        items.push({
          type: 'activity',
          key: entry.record.uri,
          activity: entry,
          associatedRecords,
          actors,
        })
      }
    }
  }

  return items.length > 0 ? items : [{type: 'empty', key: 'empty'}]
}
