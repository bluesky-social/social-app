import {atmospherePresentationConfig} from '#/screens/Atmosphere/config'
import {
  getActivityPresentationKind,
  getDocumentSocialProof,
} from '#/screens/Atmosphere/socialProof'
import {
  createActivity,
  createActor,
  createDocumentRecords,
  createRecord,
  createRow,
  createShareRecord,
  documentUri,
  present,
} from '#/screens/Atmosphere/testFixtures'
import {
  activityCollections,
  type ActivityItem,
} from '#/screens/Atmosphere/types'

// The global CID mock cannot validate real strong-reference CIDs.
jest.unmock('multiformats/cid')

function relatedRow(related: ActivityItem[]) {
  const associatedRecords = createDocumentRecords()
  const actors = {'did:plc:author': createActor()}
  for (const activity of related) {
    associatedRecords[activity.record.uri] = createRecord(
      activity.record.uri,
      activity.collection === activityCollections.recommendation
        ? {
            $type: activityCollections.recommendation,
            document: documentUri,
            createdAt: activity.record.indexedAt,
          }
        : createShareRecord(),
    )
  }
  return createRow([createActivity({relatedActivity: related})], {
    associatedRecords,
    actors: {
      ...actors,
      ...createRow(related.length ? related : [createActivity()]).actors,
    },
  })
}

function recommend(did: string, rkey = 'recommend') {
  return createActivity({
    collection: activityCollections.recommendation,
    did,
    rkey,
  })
}

function share(did: string, rkey = 'share') {
  return createActivity({collection: activityCollections.share, did, rkey})
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
    const plain = createRow([createActivity()], {
      associatedRecords: createDocumentRecords(),
    })
    const subscribed = createRow([createActivity({subscribed: true})], {
      associatedRecords: createDocumentRecords(),
    })
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
    row.associatedRecords[wrongTarget.record.uri].record.document =
      `${documentUri}-other`
    delete row.associatedRecords[noRecord.record.uri]
    row.associatedRecords[invalidShare.record.uri].record.text = null
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
    context.associatedRecords[first.record.uri] = createRecord(
      first.record.uri,
      {...context.associatedRecords[documentUri].record},
    )
    const later = createActivity({relatedActivity: [shared]})
    const row = createRow([first, later], {
      groupBy: 'actor',
      associatedRecords: context.associatedRecords,
      actors: context.actors,
    })
    expect(getActivityPresentationKind(present(row))).toBe('footnote')
    expect(
      getActivityPresentationKind(
        present(
          createRow([later, first], {
            groupBy: 'actor',
            associatedRecords: context.associatedRecords,
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
      activityCollections.grainPhoto,
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

  it('uses endedAt for prototype stream state without a freshness heuristic', () => {
    const stream = createActivity({collection: activityCollections.livestream})
    const record = createRecord(stream.record.uri, {
      $type: activityCollections.livestream,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastSeenAt: '2026-01-01T00:05:00.000Z',
      idleTimeoutSeconds: 300,
    })
    const row = createRow([stream], {associatedRecords: {[record.uri]: record}})
    expect(getActivityPresentationKind(present(row))).toBe('card')
    record.record.endedAt = '2026-01-01T01:00:00.000Z'
    expect(getActivityPresentationKind(present(row))).toBe('footnote')
    expect(
      getActivityPresentationKind(
        present(
          createRow(
            [
              stream,
              createActivity({collection: stream.collection, rkey: 'second'}),
            ],
            {groupBy: 'actor'},
          ),
        ),
      ),
    ).toBe('footnote')
    delete row.associatedRecords[record.uri]
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
