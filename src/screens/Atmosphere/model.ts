import {type InfiniteData} from '@tanstack/react-query'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  type ActivityActors,
  type ActivityGroup,
  type ActivityItem,
  type ActivityOverflow,
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
  actors: ActivityActors
}

export type ActivityOverflowRowItem = {
  type: 'overflow'
  key: string
  overflow: ActivityOverflow
}

export type ActivityListItem =
  | ActivityRowItem
  | ActivityGroupRowItem
  | ActivityOverflowRowItem
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
  for (const [pageIndex, page] of data.pages.entries()) {
    for (const [entryIndex, entry] of page.feed.entries()) {
      if (bsky.isType(schema.activityItemOverflow, entry)) {
        items.push({
          type: 'overflow',
          key: `overflow:${pageIndex}:${entryIndex}`,
          overflow: entry,
        })
      } else if (bsky.isType(schema.activityGroup, entry)) {
        if (entry.groupBy !== 'actor' && entry.groupBy !== 'subject') continue
        const groupItems = entry.items.filter(item => {
          if (seen.has(item.record.uri)) return false
          seen.add(item.record.uri)
          return true
        })
        if (groupItems.length === 0) continue
        items.push({
          type: 'group',
          key: entry.id,
          group:
            groupItems.length === entry.items.length
              ? entry
              : {...entry, items: groupItems},
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
