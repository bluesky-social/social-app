import {createAtmosphereDebugItem, hasAtmosphereDebugParam} from './debug'
import {
  createActivity,
  createActor,
  createArticleView,
  createPostView,
  createRelatedGroup,
  createRow,
} from './testFixtures'
import {activityCollections} from './types'

describe('Atmosphere debug mode', () => {
  it('keeps the actual hydrated post and reachable profile objects, excluding unrelated page profiles', () => {
    const post = createPostView()
    const activity = createActivity({
      collection: activityCollections.share,
      did: 'did:plc:sharer',
      view: post,
    })
    const actors = Object.fromEntries(
      ['sharer', 'author', 'unrelated'].map(name => {
        const actor = createActor(`did:plc:${name}`)
        return [actor.did, actor]
      }),
    )
    const item = createRow([activity], {actors})
    const result = createAtmosphereDebugItem(item)
    if (result.type !== 'activity') throw new Error('Expected activity')
    expect(result.activity).toBe(activity)
    expect(result.activity.view).toBe(post)
    expect(Object.keys(result.actors)).toEqual([
      'did:plc:sharer',
      'did:plc:author',
    ])
    expect(result.actors).not.toBe(actors)
    expect(result.actors['did:plc:sharer']).toBe(actors['did:plc:sharer'])
    expect(result.actors['did:plc:author']).toBe(actors['did:plc:author'])
  })

  it('preserves standalone article buckets, publisher views and original profile references', () => {
    const recommendation = createActivity({
      collection: activityCollections.recommendation,
      did: 'did:plc:recommender',
      view: createArticleView(),
    })
    const share = createActivity({
      collection: activityCollections.share,
      did: 'did:plc:sharer',
      view: createPostView(),
    })
    const root = createActivity({
      relatedActivity: [
        createRelatedGroup([recommendation]),
        createRelatedGroup([share]),
      ],
    })
    const actors = Object.fromEntries(
      ['author', 'publisher', 'recommender', 'sharer', 'unrelated'].map(
        name => {
          const actor = createActor(`did:plc:${name}`)
          return [actor.did, actor]
        },
      ),
    )
    const item = createRow([root], {actors})
    const result = createAtmosphereDebugItem(item)
    if (item.type !== 'activity' || result.type !== 'activity')
      throw new Error('Expected standalone article')
    expect(result.activity).toBe(root)
    expect(result.activity.relatedActivity).toBe(root.relatedActivity)
    expect(Object.keys(result.actors)).toEqual(
      expect.arrayContaining([
        'did:plc:author',
        'did:plc:publisher',
        'did:plc:recommender',
        'did:plc:sharer',
      ]),
    )
    expect(result.actors['did:plc:unrelated']).toBeUndefined()
    for (const [did, actor] of Object.entries(result.actors))
      expect(actor).toBe(actors[did])
  })

  it('requires the debug URL parameter', () => {
    expect(hasAtmosphereDebugParam('?debug')).toBe(true)
    expect(hasAtmosphereDebugParam('?before=one&debug&after=two')).toBe(true)
    expect(hasAtmosphereDebugParam('?before=one')).toBe(false)
    expect(hasAtmosphereDebugParam('')).toBe(false)
  })
})
