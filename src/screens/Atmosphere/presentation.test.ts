import {describe, expect, it} from '@jest/globals'

import {
  type ActivityPresentationItem,
  buildActivityPresentationListItems,
  getRecordActor,
} from './presentation'
import {
  createActivity,
  createActor,
  createArticleView,
  createRow,
  createSubjectGroup,
} from './testFixtures'
import {activityCollections} from './types'

function computed(item: ActivityPresentationItem) {
  return buildActivityPresentationListItems([item])[0].computedItemView
}

describe('Atmosphere presentation', () => {
  it('uses ordered subject-group profiles, not a page-index replacement', () => {
    const alice = createActor('did:plc:alice')
    const bob = createActor('did:plc:bob')
    const bad = {
      ...createActor('did:plc:bad'),
      handle: 'handle.invalid' as const,
    }
    const group = createSubjectGroup(
      [
        createActivity({
          collection: activityCollections.recommendation,
          did: alice.did,
          view: createArticleView(),
        }),
        createActivity({
          collection: activityCollections.recommendation,
          did: bob.did,
          view: createArticleView(),
        }),
      ],
      undefined,
      [bob, bad, alice, bob],
    )
    const view = computed({type: 'group', key: group.id, group, actors: {}})
    expect(view?.actors).toEqual([bob, alice])
    expect(view?.actors[0]).toBe(bob)
    expect(view?.actors[1]).toBe(alice)
  })

  it('uses the explicit actor-group identity without a fabricated profile fallback', () => {
    const first = createActivity()
    const row = createRow([first, createActivity({rkey: 'second'})], {
      groupBy: 'actor',
    })
    expect(computed(row)?.actors[0]).toBe(row.actors['did:plc:author'])
    if (row.type !== 'group' || !('actor' in row.group))
      throw new Error('Expected actor group')
    row.group.actor = 'did:plc:missing'
    expect(computed(row)).toBeUndefined()
  })

  it.each([true, false])(
    'reports only the rendered document subscription state (%s)',
    subscribed => {
      const first = createActivity({subscribed})
      const row = createRow(
        [first, createActivity({rkey: 'second', subscribed: !subscribed})],
        {groupBy: 'actor'},
      )
      expect(computed(row)?.subscriptionState).toBe(subscribed ? 'all' : 'none')
      expect(computed(createRow([first]))?.subscriptionState).toBe(
        subscribed ? 'all' : 'none',
      )
    },
  )

  it('does not claim subscription state for reference-only recommendations', () => {
    const row = createRow([
      createActivity({
        collection: activityCollections.recommendation,
        did: 'did:plc:one',
        subscribed: true,
      }),
      createActivity({
        collection: activityCollections.recommendation,
        did: 'did:plc:two',
      }),
    ])
    expect(computed(row)).toEqual({actors: Object.values(row.actors)})
  })

  it('omits rows with no usable supplied actors', () => {
    const activity = createActivity()
    const invalid = {...createActor(), handle: 'handle.invalid' as const}
    for (const row of [
      createRow([activity], {actors: {}}),
      createRow([activity, createActivity({rkey: 'other'})], {
        groupBy: 'actor',
        actors: {'did:plc:author': invalid},
      }),
    ]) {
      expect(buildActivityPresentationListItems([row])).toEqual([
        {item: {type: 'empty', key: 'empty'}, computedItemView: undefined},
      ])
    }
  })

  it('passes sentinels through without invented computed data', () => {
    const error = {type: 'error' as const, key: 'error' as const, error: 'boom'}
    expect(buildActivityPresentationListItems([error])).toEqual([
      {item: error, computedItemView: undefined},
    ])
    expect(buildActivityPresentationListItems([])).toEqual([
      {item: {type: 'empty', key: 'empty'}, computedItemView: undefined},
    ])
  })

  it('rejects handle authorities, missing profiles, and mismatched profile index keys', () => {
    const author = createActor()
    const actors = {'did:plc:author': author, 'did:plc:wrong': author}
    expect(
      getRecordActor(
        'at://did:plc:author/site.standard.document/article',
        actors,
      ),
    ).toBe(author)
    for (const uri of [
      'at://did:plc:missing/site.standard.document/article',
      'at://did:plc:wrong/site.standard.document/article',
      'at://author.example/site.standard.document/article',
      'not-a-uri',
    ])
      expect(getRecordActor(uri, actors)).toBeUndefined()
  })
})
