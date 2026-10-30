import {getDocumentSocialProof} from '#/screens/Atmosphere/socialProof'
import {
  createActivity,
  createActor,
  createArticleView,
  createPostView,
  createRow,
  documentUri,
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
  })

  it('does not treat a self-share as a recommendation', () => {
    const row = relatedRow([share('did:plc:author')])
    if (row.type !== 'activity')
      throw new Error('Expected a standalone document')
    expect(getDocumentSocialProof(row.activity, row).recommenders).toEqual([])
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
    expect(row.activity.relatedActivity).toBe(children)
  })
})
