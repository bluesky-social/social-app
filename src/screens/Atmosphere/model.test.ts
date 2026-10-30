import {type l} from '@atproto/lex'
import {describe, expect, it} from '@jest/globals'

import {buildActivityListItems} from './model'
import {createActivity, createActor, createRow} from './testFixtures'
import {activityCollections, type AtmosphereActivityPage} from './types'

function page(
  values: Partial<AtmosphereActivityPage> = {},
): AtmosphereActivityPage {
  return {feed: [], actors: {}, ...values}
}

function group() {
  const row = createRow(
    [
      createActivity({rkey: 'one', subscribed: true}),
      createActivity({rkey: 'two'}),
    ],
    {groupBy: 'actor'},
  )
  if (row.type !== 'group') throw new Error('Expected group fixture')
  return {
    ...row.group,
    $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityGroup' as const,
  }
}

describe('Atmosphere list model', () => {
  it('returns loading, error, and empty list states', () => {
    expect(buildActivityListItems(undefined)).toEqual([
      {type: 'loading', key: 'loading'},
    ])
    expect(buildActivityListItems(undefined, 'boom')).toEqual([
      {type: 'error', key: 'error', error: 'boom'},
    ])
    expect(
      buildActivityListItems({pages: [page()], pageParams: [undefined]}),
    ).toEqual([{type: 'empty', key: 'empty'}])
  })

  it('preserves server groups, ordered children, related activity and original references', () => {
    const grouped = group()
    const related = [
      createActivity({collection: activityCollections.recommendation}),
    ]
    grouped.items[0].relatedActivity = related
    const actors = {'did:plc:author': createActor()}
    const [row] = buildActivityListItems({
      pages: [page({feed: [grouped], actors})],
      pageParams: [undefined],
    })
    if (row.type !== 'group') throw new Error('Expected group')
    expect(row.group).toBe(grouped)
    expect(row.group.items[0].relatedActivity).toBe(related)
    expect(row.group.items.map(item => item.viewerState.subscribed)).toEqual([
      true,
      false,
    ])
    expect(row.actors).toBe(actors)
  })

  it('deduplicates only activity URIs across pages, retaining server groups and every overflow', () => {
    const grouped = group()
    const first = createActivity({rkey: 'one'})
    const overflow = {
      $type:
        'app.bsky.unspecced.getAtmosphereTimeline#activityItemOverflow' as const,
      collection: activityCollections.document,
      count: 7,
      associatedProfiles: [createActor()],
    }
    const firstActors = {'did:plc:author': createActor()}
    const secondActors = {
      'did:plc:author': {...createActor(), displayName: 'Second page'},
    }
    const pages = [
      page({
        feed: [first, overflow],
        actors: firstActors,
        cursor: 'opaque==cursor',
      }),
      page({feed: [grouped, first, overflow], actors: secondActors}),
    ]
    const rows = buildActivityListItems({
      pages,
      pageParams: [undefined, 'opaque==cursor'],
    })
    expect(rows.map(row => row.type)).toEqual([
      'activity',
      'overflow',
      'group',
      'overflow',
    ])
    expect(rows.map(row => row.key)).toEqual([
      first.record.uri,
      'overflow:0:1',
      grouped.id,
      'overflow:1:2',
    ])
    if (rows[0].type !== 'activity' || rows[2].type !== 'group')
      throw new Error('Expected activity and group')
    expect(rows[0].actors).toBe(firstActors)
    expect(rows[2].actors).toBe(secondActors)
    expect(rows[2].group.items).toEqual([grouped.items[1]])
    expect(grouped.items).toHaveLength(2)
    expect(pages[0].cursor).toBe('opaque==cursor')
    expect(rows[1]).toMatchObject({overflow})
    expect(rows[3]).toMatchObject({overflow})
  })

  it('omits unknown feed unions and groupBy without claiming their children', () => {
    const grouped = group()
    const known = createActivity({rkey: 'one'})
    const rows = buildActivityListItems({
      pages: [
        page({
          feed: [
            {$type: 'example.future#entry' as l.Unknown$Type},
            {...grouped, groupBy: 'future'},
            known,
          ],
        }),
      ],
      pageParams: [undefined],
    })
    expect(rows).toEqual([
      {type: 'activity', key: known.record.uri, activity: known, actors: {}},
    ])
  })
})
