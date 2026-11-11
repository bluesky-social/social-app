import {type ActivityPresentationListItem} from '#/screens/Atmosphere/presentation'
import {
  type ActivityRowKind,
  getActivityRowKind,
} from '#/screens/Atmosphere/rowLayout'
import {
  type ActivityDateBucket,
  getActivityDateBucket,
} from '#/screens/Atmosphere/timelineDates'

export type ActivityDateHeading = Extract<ActivityDateBucket, {key: string}>

export type ActivityTimelineListItem = ActivityPresentationListItem & {
  layout?: {
    kind: ActivityRowKind
    gap: number
    separator: boolean
    heading?: ActivityDateHeading
  }
}

/** Decorates visible activities while preserving server group order. */
export function buildActivityTimelineItems(
  items: ActivityPresentationListItem[],
  now: Date,
): ActivityTimelineListItem[] {
  const result: ActivityTimelineListItem[] = []
  const headings = new Set<string>()
  let previousKind: ActivityRowKind | undefined

  for (const row of items) {
    const {item, computedItemView} = row
    if (item.type !== 'activity' && item.type !== 'group') {
      result.push(row)
      previousKind = undefined
      continue
    }
    if (!computedItemView) continue
    const kind = getActivityRowKind({item, computedItemView})
    if (!kind) continue
    const timestamp =
      item.type === 'group'
        ? item.group.indexedAt
        : item.activity.record.indexedAt
    const bucket = getActivityDateBucket(timestamp, now)
    const heading =
      'key' in bucket && !headings.has(bucket.key) ? bucket : undefined
    if ('key' in bucket) headings.add(bucket.key)
    const gap = !previousKind
      ? 24
      : heading
        ? 40
        : kind === 'card' || previousKind === 'card'
          ? 32
          : 28
    result.push({
      ...row,
      layout: {
        kind,
        gap,
        separator:
          !heading && kind === 'footnote' && previousKind === 'footnote',
        heading,
      },
    })
    previousKind = kind
  }

  return result.length > 0
    ? result
    : [{item: {type: 'empty', key: 'empty'}, computedItemView: undefined}]
}
