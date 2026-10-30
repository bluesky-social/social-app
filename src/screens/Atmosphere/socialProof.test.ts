import {atmospherePresentationConfig} from '#/screens/Atmosphere/config'
import {
  getActivityPresentationKind,
  getDocumentSocialProof,
} from '#/screens/Atmosphere/socialProof'
import {
  createActivity,
  createActor,
  createArticleView,
  createLivestreamView,
  createPostView,
  createRow,
  documentUri,
  present,
  recordCid,
} from '#/screens/Atmosphere/testFixtures'
import {
  type ActivityActor,
  activityCollections,
  type ActivityItem,
} from '#/screens/Atmosphere/types'

// The global CID mock cannot validate real strong-reference CIDs.
jest.unmock('multiformats/cid')

function relatedRow(related: ActivityItem[]) {
  const actors = {'did:plc:author': createActor()}
  return createRow([createActivity({relatedActivity: related})], {
    actors: {
      ...actors,
      ...createRow(related.length ? related : [createActivity()]).actors,
    },
  })
}

function recommend(did: ActivityActor['did'], rkey = 'recommend') {
  return createActivity({
    collection: activityCollections.recommendation,
    did,
    rkey,
    view: createArticleView(),
  })
}

function share(did: ActivityActor['did'], rkey = 'share') {
  return createActivity({
    collection: activityCollections.share,
    did,
    rkey,
    view: createPostView({
      uri: `at://${did}/${activityCollections.share}/${rkey}`,
      author: createActor(did),
    }),
  })
}

describe('Atmosphere social-proof rules', () => {
  it.each([
    activityCollections.recommendation,
    activityCollections.subscription,
  ])(
    'uses independently configurable two-person thresholds for %s',
    collection => {
      for (const [count, expected] of [
        [1, 'footnote'],
        [2, 'card'],
        [3, 'card'],
      ] as const) {
        const row = createRow(
          Array.from({length: count}, (_, index) =>
            createActivity({collection, did: `did:plc:actor${index}`}),
          ),
        )
        expect(getActivityPresentationKind(present(row))).toBe(expected)
      }
      const twoActors = present(
        createRow([
          createActivity({collection, did: 'did:plc:one'}),
          createActivity({collection, did: 'did:plc:two'}),
        ]),
      )
      const configKey =
        collection === activityCollections.recommendation
          ? 'recommendationCardThreshold'
          : 'subscriptionCardThreshold'
      expect(
        getActivityPresentationKind(twoActors, {
          ...atmospherePresentationConfig,
          [configKey]: 3,
        }),
      ).toBe('footnote')
      const otherKey =
        configKey === 'recommendationCardThreshold'
          ? 'subscriptionCardThreshold'
          : 'recommendationCardThreshold'
      expect(
        getActivityPresentationKind(twoActors, {
          ...atmospherePresentationConfig,
          [otherKey]: 3,
        }),
      ).toBe('card')
    },
  )

  it.each([false, true])(
    'does not use target-author following (following=%s)',
    following => {
      const row = createRow([recommend('did:plc:one')])
      row.actors['did:plc:author'] = {
        ...createActor(),
        viewer: following
          ? {following: 'at://did:plc:viewer/app.bsky.graph.follow/author'}
          : undefined,
      }
      expect(getActivityPresentationKind(present(row))).toBe('footnote')
    },
  )

  it('counts usable distinct actors rather than records or missing people', () => {
    const row = createRow(
      [
        recommend('did:plc:one'),
        recommend('did:plc:one', 'duplicate'),
        recommend('did:plc:missing'),
        recommend('did:plc:invalid'),
      ],
      {
        actors: {
          'did:plc:one': createActor('did:plc:one'),
          'did:plc:invalid': {
            ...createActor('did:plc:invalid'),
            handle: 'handle.invalid',
          },
        },
      },
    )
    expect(getActivityPresentationKind(present(row))).toBe('footnote')
    row.actors['did:plc:missing'] = createActor('did:plc:missing')
    expect(getActivityPresentationKind(present(row))).toBe('card')
  })

  it.each([
    activityCollections.recommendation,
    activityCollections.subscription,
  ])(
    'does not promote an actor group as same-subject social proof (%s)',
    collection => {
      const row = createRow(
        Array.from({length: 15}, (_, index) =>
          createActivity({collection, rkey: String(index)}),
        ),
        {groupBy: 'actor'},
      )
      expect(
        getActivityPresentationKind(present(row), {
          recommendationCardThreshold: 1,
          subscriptionCardThreshold: 1,
        }),
      ).toBe('footnote')
    },
  )

  it('promotes subscribed documents and related recommendations using the same threshold', () => {
    const plain = createRow([createActivity()])
    const subscribed = createRow([createActivity({subscribed: true})])
    expect(getActivityPresentationKind(present(plain))).toBe('footnote')
    expect(getActivityPresentationKind(present(subscribed))).toBe('card')
    const one = relatedRow([recommend('did:plc:one')])
    const two = relatedRow([recommend('did:plc:one'), recommend('did:plc:two')])
    expect(getActivityPresentationKind(present(one))).toBe('footnote')
    expect(getActivityPresentationKind(present(two))).toBe('card')
    expect(
      getActivityPresentationKind(present(two), {
        ...atmospherePresentationConfig,
        recommendationCardThreshold: 3,
      }),
    ).toBe('footnote')
  })

  it('keeps mixed proof separate, deduplicated, in API order, with original references', () => {
    const first = recommend('did:plc:one')
    const shared = share('did:plc:one')
    const selfShared = share('did:plc:author')
    const second = recommend('did:plc:two')
    const row = relatedRow([
      first,
      shared,
      second,
      selfShared,
      recommend('did:plc:one', 'duplicate'),
      share('did:plc:one', 'duplicate'),
    ])
    if (row.type !== 'activity')
      throw new Error('Expected a standalone document')
    const proof = getDocumentSocialProof(row.activity, row)
    expect(proof.recommenders.map(actor => actor.did)).toEqual([
      'did:plc:one',
      'did:plc:two',
    ])
    expect(proof.shares.map(entry => entry.actor.did)).toEqual([
      'did:plc:one',
      'did:plc:author',
    ])
    expect(proof.recommenders[0]).toBe(row.actors['did:plc:one'])
    expect(proof.shares[0].activity).toBe(shared)
    expect(proof.shares[0].actor).toBe(row.actors['did:plc:one'])
    expect(proof.shares[1].activity).toBe(selfShared)
    expect(row.activity.relatedActivity?.[0]).toBe(first)
    expect(getActivityPresentationKind(present(row))).toBe('card')
  })

  it('promotes a self-share without claiming additional recommendation actors', () => {
    const row = relatedRow([share('did:plc:author')])
    if (row.type !== 'activity')
      throw new Error('Expected a standalone document')
    expect(getDocumentSocialProof(row.activity, row).recommenders).toEqual([])
    expect(getActivityPresentationKind(present(row))).toBe('card')
  })

  it('does not attribute interactions pinned to a different document revision', () => {
    const recommendation = recommend('did:plc:recommender')
    const shared = share('did:plc:sharer')
    const row = relatedRow([recommendation, shared])
    if (row.type !== 'activity') throw new Error('Expected standalone document')
    row.activity.record.cid = 'bafyreifutureversion'
    expect(getDocumentSocialProof(row.activity, row)).toEqual({
      recommenders: [],
      shares: [],
    })
    expect(getActivityPresentationKind(present(row))).toBe('footnote')
  })

  it('ignores missing, invalid, and unrelated proof without mutating it', () => {
    const missing = recommend('did:plc:missing')
    const badActor = recommend('did:plc:bad')
    const wrongTarget = recommend('did:plc:wrong')
    const noRecord = share('did:plc:no-record')
    const invalidShare = share('did:plc:invalid-share')
    const invalidSource = share('did:plc:invalid-source')
    invalidSource.record.uri =
      'at://did:plc:invalid-source/site.standard.document/not-a-post'
    const unrelated = createActivity({
      collection: activityCollections.subscription,
    })
    const children = [
      missing,
      badActor,
      wrongTarget,
      noRecord,
      invalidShare,
      invalidSource,
      unrelated,
    ]
    const row = relatedRow(children)
    delete row.actors['did:plc:missing']
    row.actors['did:plc:bad'].handle = 'handle.invalid'
    wrongTarget.view = createArticleView({
      associatedRefs: [{uri: `${documentUri}-other`, cid: recordCid}],
    })
    noRecord.view = undefined
    invalidShare.view = createPostView({
      record: {
        $type: activityCollections.share,
        text: null,
        createdAt: invalidShare.record.indexedAt,
      },
    })
    if (row.type !== 'activity')
      throw new Error('Expected a standalone document')
    expect(getDocumentSocialProof(row.activity, row)).toEqual({
      recommenders: [],
      shares: [],
    })
    expect(getActivityPresentationKind(present(row))).toBe('footnote')
    expect(row.activity.relatedActivity).toBe(children)
  })

  it('uses only the first document in actor groups, even when a later child has stronger proof', () => {
    const shared = share('did:plc:one')
    const context = relatedRow([shared])
    const first = createActivity({rkey: 'first'})
    const later = createActivity({relatedActivity: [shared]})
    const row = createRow([first, later], {
      groupBy: 'actor',
      actors: context.actors,
    })
    expect(getActivityPresentationKind(present(row))).toBe('footnote')
    expect(
      getActivityPresentationKind(
        present(
          createRow([later, first], {
            groupBy: 'actor',
            actors: context.actors,
          }),
        ),
      ),
    ).toBe('card')
  })

  it('does not join proof across separate rows or pages sharing a document', () => {
    const rows = [
      createRow([recommend('did:plc:one')]),
      createRow([recommend('did:plc:two')]),
    ]
    expect(rows.map(row => getActivityPresentationKind(present(row)))).toEqual([
      'footnote',
      'footnote',
    ])
  })

  it('keeps shares and photos as cards, including bounded actor previews and photo galleries', () => {
    for (const collection of [
      activityCollections.share,
      activityCollections.grainGallery,
      activityCollections.grainFavorite,
    ]) {
      const first = createActivity({collection})
      expect(getActivityPresentationKind(present(createRow([first])))).toBe(
        'card',
      )
      expect(
        getActivityPresentationKind(
          present(
            createRow([first, createActivity({collection, rkey: 'second'})], {
              groupBy: 'actor',
            }),
          ),
        ),
      ).toBe('card')
    }
  })

  it('uses served active state for stale unfinished streams and keeps actor groups compact', () => {
    const view = createLivestreamView({createdAt: '2020-01-01T00:00:00.000Z'})
    const stream = createActivity({
      collection: activityCollections.livestream,
      view,
    })
    const row = createRow([stream])
    expect(getActivityPresentationKind(present(row))).toBe('card')
    view.active = false
    expect(getActivityPresentationKind(present(row))).toBe('footnote')
    view.active = true
    expect(
      getActivityPresentationKind(
        present(
          createRow(
            [
              stream,
              createActivity({
                collection: stream.collection,
                rkey: 'second',
                view,
              }),
            ],
            {groupBy: 'actor'},
          ),
        ),
      ),
    ).toBe('footnote')
    stream.view = undefined
    expect(getActivityPresentationKind(present(row))).toBe('footnote')
  })

  it('leaves unknown collections and rows without usable actors as footnotes', () => {
    expect(
      getActivityPresentationKind(
        present(
          createRow([createActivity({collection: 'example.other.record'})]),
        ),
      ),
    ).toBe('footnote')
    expect(
      getActivityPresentationKind(
        present(createRow([share('did:plc:missing')], {actors: {}})),
      ),
    ).toBe('footnote')
  })
})
