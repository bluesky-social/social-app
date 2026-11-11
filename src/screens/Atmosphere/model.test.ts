import {type l} from '@atproto/lex'
import {describe, expect, it} from '@jest/globals'

import {buildActivityListItems} from './model'
import {
  createActivity,
  createActor,
  createActorGroup,
  createArticleView,
  createSubjectGroup,
} from './testFixtures'
import {activityCollections, type AtmosphereActivityPage} from './types'

function page(
  values: Partial<AtmosphereActivityPage> = {},
): AtmosphereActivityPage {
  return {feed: [], actors: {}, ...values}
}

function rows(pages: AtmosphereActivityPage[]) {
  return buildActivityListItems({pages, pageParams: pages.map(() => undefined)})
}

describe('Atmosphere list model', () => {
  it('returns loading, error, and empty list states', () => {
    expect(buildActivityListItems(undefined)).toEqual([
      {type: 'loading', key: 'loading'},
    ])
    expect(buildActivityListItems(undefined, 'boom')).toEqual([
      {type: 'error', key: 'error', error: 'boom'},
    ])
    expect(rows([page()])).toEqual([{type: 'empty', key: 'empty'}])
  })

  it('preserves both API group shapes and their supplied references', () => {
    const newest = createActivity({rkey: 'newest', subscribed: true})
    const actorGroup = createActorGroup([
      newest,
      createActivity({rkey: 'older'}),
    ])
    const subjectGroup = createSubjectGroup([
      createActivity({
        collection: activityCollections.recommendation,
        did: 'did:plc:one',
        view: createArticleView(),
      }),
      createActivity({
        collection: activityCollections.recommendation,
        did: 'did:plc:two',
        view: createArticleView(),
      }),
    ])
    const actors = {'did:plc:author': createActor()}
    const result = rows([page({feed: [actorGroup, subjectGroup], actors})])
    if (result[0].type !== 'group' || result[1].type !== 'group')
      throw new Error('Expected groups')
    expect(result[0].group).toBe(actorGroup)
    expect(result[1].group).toBe(subjectGroup)
    expect(result[0].actors).toBe(actors)
    expect(actorGroup.item).toBe(newest)
    expect(subjectGroup.activities[0]).not.toHaveProperty('view')
  })

  it('filters actor URIs without replacing its only hydrated item or mutating raw JSON', () => {
    const newest = createActivity({rkey: 'newest'})
    const older = createActivity({rkey: 'older'})
    const group = createActorGroup([newest, older])
    const before = JSON.stringify(group)
    const result = rows([page({feed: [older]}), page({feed: [group, newest]})])
    expect(result).toHaveLength(2)
    if (result[1].type !== 'group') throw new Error('Expected group')
    expect(result[1].group).toEqual({...group, uris: [newest.record.uri]})
    expect(result[1].rawGroup).toBe(group)
    expect(JSON.stringify(group)).toBe(before)
  })

  it('never promotes an unavailable older actor-group member after a duplicate newest item', () => {
    const newest = createActivity({rkey: 'newest'})
    const older = createActivity({rkey: 'older'})
    const group = createActorGroup([newest, older])
    const result = rows([page({feed: [newest, group, older]})])
    expect(result.map(row => row.key)).toEqual([
      newest.record.uri,
      older.record.uri,
    ])
    expect(result.every(row => row.type === 'activity')).toBe(true)
  })

  it('filters subject references and profiles in API order while retaining raw groups', () => {
    const first = createActivity({
      collection: activityCollections.recommendation,
      did: 'did:plc:one',
      view: createArticleView(),
    })
    const second = createActivity({
      collection: activityCollections.recommendation,
      did: 'did:plc:two',
      view: createArticleView(),
    })
    const third = createActivity({
      collection: activityCollections.recommendation,
      did: 'did:plc:three',
      view: createArticleView(),
    })
    const group = createSubjectGroup([first, second, third])
    const before = JSON.stringify(group)
    const result = rows([
      page({feed: [first], cursor: 'opaque==cursor'}),
      page({feed: [group, second]}),
    ])
    if (result[1].type !== 'group') throw new Error('Expected group')
    expect(result).toHaveLength(2)
    expect(result[1].group).toEqual({
      ...group,
      activities: group.activities.slice(1),
      actors: group.actors.slice(1),
    })
    expect(result[1].rawGroup).toBe(group)
    expect(JSON.stringify(group)).toBe(before)
  })

  it('removes repeated member URIs within groups and across pages', () => {
    const first = createActivity({
      collection: activityCollections.recommendation,
      did: 'did:plc:one',
      view: createArticleView(),
    })
    const second = createActivity({
      collection: activityCollections.recommendation,
      did: 'did:plc:two',
      view: createArticleView(),
    })
    const group = createSubjectGroup([first, first, second])
    const result = rows([
      page({feed: [group]}),
      page({feed: [group, first, second]}),
    ])
    expect(result).toHaveLength(1)
    if (result[0].type !== 'group') throw new Error('Expected group')
    expect(result[0].group).toEqual({
      ...group,
      activities: [group.activities[0], group.activities[2]],
    })
  })

  it('omits unknown feed unions without claiming any activity URIs', () => {
    const activity = createActivity()
    expect(
      rows([
        page({
          feed: [{$type: 'example.future#entry' as l.Unknown$Type}, activity],
        }),
      ]),
    ).toEqual([
      {type: 'activity', key: activity.record.uri, activity, actors: {}},
    ])
  })
})
