import {describe, expect, it} from '@jest/globals'

import {buildActivityListItems} from './model'
import {buildActivityPresentationListItems} from './presentation'
import {
  createActivity,
  createActor,
  createRecord,
  createRow,
} from './testFixtures'
import {buildActivityTimelineItems} from './timeline'
import {
  type ActivityActor,
  activityCollections,
  type ActivityFeedEntry,
  type AssociatedRecords,
  type AtmosphereActivityPage,
} from './types'

function localDate(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
) {
  return new Date(year, month - 1, day, hour, minute)
}

function unknownActivity({
  did = 'did:plc:timeline',
  rkey = 'item',
  indexedAt,
}: {
  did?: string
  rkey?: string
  indexedAt: Date
}) {
  const activity = createActivity({
    collection: 'example.unknown.collection',
    did,
    rkey,
  })
  activity.record.indexedAt = indexedAt.toISOString()
  return activity
}

function publicationActivity(rkey: string, indexedAt: Date) {
  const activity = createActivity({
    collection: activityCollections.publication,
    did: 'did:plc:publisher',
    rkey,
  })
  activity.record.indexedAt = indexedAt.toISOString()
  return activity
}

function page(
  feed: ActivityFeedEntry[],
  {
    associatedRecords = {},
    actors = {},
  }: {
    associatedRecords?: AssociatedRecords
    actors?: Record<string, ActivityActor>
  } = {},
): AtmosphereActivityPage {
  return {feed, associatedRecords, actors}
}

function timeline(pages: AtmosphereActivityPage[], now: Date) {
  const listItems = buildActivityListItems({
    pages,
    pageParams: pages.map(() => undefined),
  })
  return buildActivityTimelineItems(
    buildActivityPresentationListItems(listItems),
    now,
  )
}

describe('Atmosphere timeline integration', () => {
  it('preserves card and footnote ordering and separates only consecutive footnotes across pages', () => {
    const now = localDate(2026, 9, 10)
    const cardOne = publicationActivity('card-one', now)
    const cardTwo = publicationActivity(
      'card-two',
      new Date(now.getTime() - 1_000),
    )
    const footnoteOne = unknownActivity({
      rkey: 'footnote-one',
      indexedAt: new Date(now.getTime() - 2_000),
    })
    const footnoteTwo = unknownActivity({
      rkey: 'footnote-two',
      indexedAt: new Date(now.getTime() - 3_000),
    })
    const cardThree = publicationActivity(
      'card-three',
      new Date(now.getTime() - 4_000),
    )
    const publicationRecords = [cardOne, cardTwo, cardThree].reduce(
      (records, activity) => {
        records[activity.record.uri] = createRecord(activity.record.uri, {
          $type: activityCollections.publication,
          name: 'A publication',
          url: 'https://publication.example/',
        })
        return records
      },
      {} as AssociatedRecords,
    )
    const items = timeline(
      [
        page([cardOne, cardTwo, footnoteOne], {
          associatedRecords: publicationRecords,
          actors: {
            'did:plc:publisher': createActor('did:plc:publisher'),
            'did:plc:timeline': createActor('did:plc:timeline'),
          },
        }),
        page([footnoteTwo, cardThree], {
          associatedRecords: publicationRecords,
          actors: {
            'did:plc:publisher': createActor('did:plc:publisher'),
            'did:plc:timeline': createActor('did:plc:timeline'),
          },
        }),
      ],
      now,
    )

    expect(
      items.map(
        item => item.item.type === 'activity' && item.item.activity.record.uri,
      ),
    ).toEqual(
      [cardOne, cardTwo, footnoteOne, footnoteTwo, cardThree].map(
        activity => activity.record.uri,
      ),
    )
    expect(items.map(item => item.layout?.kind)).toEqual([
      'card',
      'card',
      'footnote',
      'footnote',
      'card',
    ])
    expect(items.map(item => item.layout?.separator)).toEqual([
      false,
      false,
      false,
      true,
      false,
    ])
  })

  it('does not leave an orphan heading or separator for rows omitted by presentation', () => {
    const now = localDate(2026, 9, 10)
    const suppressed = unknownActivity({
      did: 'did:plc:missing-actor',
      rkey: 'suppressed',
      indexedAt: localDate(2026, 9, 1),
    })
    const visible = unknownActivity({
      rkey: 'visible',
      indexedAt: now,
    })
    const items = timeline(
      [
        page([suppressed, visible], {
          actors: {'did:plc:timeline': createActor('did:plc:timeline')},
        }),
      ],
      now,
    )

    expect(items).toHaveLength(1)
    expect(items[0].item).toBeDefined()
    expect(items[0].layout?.kind).toBe('footnote')
    expect(items[0].layout?.separator).toBe(false)
    expect(items[0].layout?.heading).toBeUndefined()
    expect(items[0].layout).toEqual(
      timeline(
        [
          page([visible], {
            actors: {'did:plc:timeline': createActor('did:plc:timeline')},
          }),
        ],
        now,
      )[0].layout,
    )
  })

  it('adds rolling recent, local today, yesterday, and date headings once across pages', () => {
    const now = localDate(2026, 9, 11, 12)
    const recent = unknownActivity({
      rkey: 'recent',
      indexedAt: localDate(2026, 9, 11, 11),
    })
    const today = unknownActivity({
      rkey: 'today',
      indexedAt: localDate(2026, 9, 11, 7),
    })
    const todayAgain = unknownActivity({
      rkey: 'today-again',
      indexedAt: localDate(2026, 9, 11, 6),
    })
    const yesterday = unknownActivity({
      rkey: 'yesterday',
      indexedAt: localDate(2026, 9, 10, 12),
    })
    const yesterdayAgain = unknownActivity({
      rkey: 'yesterday-again',
      indexedAt: localDate(2026, 9, 10, 11),
    })
    const older = unknownActivity({
      rkey: 'older',
      indexedAt: localDate(2026, 9, 9, 12),
    })
    const actor = createActor('did:plc:timeline')
    const items = timeline(
      [
        page([recent, today, todayAgain], {
          actors: {'did:plc:timeline': actor},
        }),
        page([yesterday, yesterdayAgain, older], {
          actors: {'did:plc:timeline': actor},
        }),
      ],
      now,
    )

    expect(items.map(item => item.layout?.heading?.key)).toEqual([
      undefined,
      '2026-09-11',
      undefined,
      '2026-09-10',
      undefined,
      '2026-09-09',
    ])
    expect(
      items
        .filter(item => item.layout?.heading)
        .map(item => item.layout?.heading?.key),
    ).toEqual(['2026-09-11', '2026-09-10', '2026-09-09'])
  })

  it('uses the outer group timestamp and preserves row, view, sidecar, child, and key references', () => {
    const now = localDate(2026, 9, 11, 12)
    const first = unknownActivity({
      did: 'did:plc:group-author',
      rkey: 'first',
      indexedAt: now,
    })
    const second = unknownActivity({
      did: 'did:plc:group-author',
      rkey: 'second',
      indexedAt: now,
    })
    const actor = createActor('did:plc:group-author')
    const firstRecord = createRecord(first.record.uri, {marker: 'first'})
    const secondRecord = createRecord(second.record.uri, {marker: 'second'})
    const sourceGroup = createRow([first, second], {
      groupBy: 'actor',
      associatedRecords: {
        [first.record.uri]: firstRecord,
        [second.record.uri]: secondRecord,
      },
      actors: {'did:plc:group-author': actor},
    })
    if (sourceGroup.type !== 'group') throw new Error('Expected source group')
    sourceGroup.group.indexedAt = localDate(2026, 9, 9, 12).toISOString()

    const listItems = buildActivityListItems({
      pages: [
        page([sourceGroup.group], {
          associatedRecords: sourceGroup.associatedRecords,
          actors: sourceGroup.actors,
        }),
      ],
      pageParams: [undefined],
    })
    const presentationItems = buildActivityPresentationListItems(listItems)
    const [presentationItem] = presentationItems
    const items = buildActivityTimelineItems(presentationItems, now)
    const [item] = items

    expect(item.item.key).toBe(sourceGroup.key)
    expect(item.item).toBe(presentationItem.item)
    expect(item.computedItemView).toBe(presentationItem.computedItemView)
    expect(item.item).toBe(listItems[0])
    if (item.item.type !== 'group' || listItems[0].type !== 'group')
      throw new Error('Expected grouped timeline item')
    expect(item.item.key).toBe(listItems[0].key)
    expect(item.item.associatedRecords).toBe(listItems[0].associatedRecords)
    expect(item.item.actors['did:plc:group-author']).toBe(actor)
    expect(item.item.associatedRecords[first.record.uri]).toBe(firstRecord)
    expect(item.item.group.items[0]).toBe(first)
    expect(item.item.group.items[1]).toBe(second)
    expect(item.item.group.items).toBe(listItems[0].group.items)
    expect(item.layout?.heading?.key).toBe('2026-09-09')
  })

  it('keeps repeated subjects as distinct outer rows without regrouping', () => {
    const now = localDate(2026, 9, 11, 12)
    const firstGroup = createRow(
      [
        unknownActivity({did: 'did:plc:first', rkey: 'one', indexedAt: now}),
        unknownActivity({did: 'did:plc:first', rkey: 'two', indexedAt: now}),
      ],
      {
        groupBy: 'subject',
        actors: {'did:plc:first': createActor('did:plc:first')},
      },
    )
    const secondGroup = createRow(
      [
        unknownActivity({did: 'did:plc:second', rkey: 'one', indexedAt: now}),
        unknownActivity({did: 'did:plc:second', rkey: 'two', indexedAt: now}),
      ],
      {
        groupBy: 'subject',
        actors: {'did:plc:second': createActor('did:plc:second')},
      },
    )
    if (firstGroup.type !== 'group' || secondGroup.type !== 'group')
      throw new Error('Expected repeated subject groups')
    firstGroup.group.id = 'first-group'
    secondGroup.group.id = 'second-group'

    const items = timeline(
      [
        page([firstGroup.group], {actors: firstGroup.actors}),
        page([secondGroup.group], {actors: secondGroup.actors}),
      ],
      now,
    )

    expect(items).toHaveLength(2)
    expect(items.map(item => item.item.key)).toEqual([
      'first-group',
      'second-group',
    ])
    expect(
      items.map(item => item.item.type === 'group' && item.item.group.id),
    ).toEqual(['first-group', 'second-group'])
    expect(items.map(item => item.layout?.heading)).toEqual([
      undefined,
      undefined,
    ])
  })

  it('keeps loading, error, and empty sentinels as sentinels', () => {
    const now = localDate(2026, 9, 11)
    expect(
      buildActivityTimelineItems(
        buildActivityPresentationListItems(buildActivityListItems(undefined)),
        now,
      ),
    ).toEqual([
      {item: {type: 'loading', key: 'loading'}, computedItemView: undefined},
    ])
    expect(
      buildActivityTimelineItems(
        buildActivityPresentationListItems(
          buildActivityListItems(undefined, 'boom'),
        ),
        now,
      ),
    ).toEqual([
      {
        item: {type: 'error', key: 'error', error: 'boom'},
        computedItemView: undefined,
      },
    ])
    expect(timeline([page([])], now)).toEqual([
      {item: {type: 'empty', key: 'empty'}, computedItemView: undefined},
    ])
  })
})
