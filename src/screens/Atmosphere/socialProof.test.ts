import {getDocumentSocialProof} from '#/screens/Atmosphere/socialProof'
import {
  createActivity,
  createActor,
  createRelatedGroup,
  createSubjectGroup,
} from '#/screens/Atmosphere/testFixtures'
import {
  type ActivityActor,
  activityCollections,
} from '#/screens/Atmosphere/types'

function recommend(did: ActivityActor['did'], rkey = 'recommend') {
  return createActivity({
    collection: activityCollections.recommendation,
    did,
    rkey,
  })
}

function share(did: ActivityActor['did'], rkey = 'share') {
  return createActivity({collection: activityCollections.share, did, rkey})
}

describe('Atmosphere social-proof buckets', () => {
  it('keeps ordered categories and supplied reference/profile objects without hydrated views', () => {
    const recommendations = createRelatedGroup([
      recommend('did:plc:one'),
      recommend('did:plc:two'),
      recommend('did:plc:one', 'another'),
    ])
    const shares = createRelatedGroup([
      share('did:plc:one'),
      share('did:plc:author'),
      share('did:plc:one', 'another'),
    ])
    const relatedActivity = [shares, recommendations]
    const document = createActivity({relatedActivity})
    const proof = getDocumentSocialProof(document)
    expect(proof.recommenders).toEqual(recommendations.actors)
    expect(proof.recommenders[0]).toBe(recommendations.actors[0])
    expect(proof.shares.map(entry => entry.activity)).toEqual(shares.activities)
    expect(proof.shares[0].activity).toBe(shares.activities[0])
    expect(proof.shares[0].actor).toBe(shares.actors[0])
    expect(proof.shares[0].activity).not.toHaveProperty('view')
    expect(proof.shares[0].activity).not.toHaveProperty('viewerState')
    expect(document.relatedActivity).toBe(relatedActivity)
  })

  it('does not infer recommendations from self-shares or require unavailable share post content', () => {
    const bucket = createRelatedGroup([share('did:plc:author')])
    const proof = getDocumentSocialProof(
      createActivity({relatedActivity: [bucket]}),
    )
    expect(proof.recommenders).toEqual([])
    expect(proof.shares).toHaveLength(1)
    expect(proof.shares[0].activity).toBe(bucket.activities[0])
  })

  it('deduplicates exact share references while retaining distinct posts by the same actor', () => {
    const first = share('did:plc:one')
    const bucket = createRelatedGroup([
      first,
      first,
      share('did:plc:one', 'second'),
    ])
    const proof = getDocumentSocialProof(
      createActivity({relatedActivity: [bucket, bucket]}),
    )
    expect(proof.shares.map(entry => entry.activity.record.uri)).toEqual([
      first.record.uri,
      bucket.activities[2].record.uri,
    ])
  })

  it('ignores missing/invalid profiles, mismatched bucket collections and invalid share sources', () => {
    const recommendations = createRelatedGroup(
      [recommend('did:plc:missing'), recommend('did:plc:bad')],
      [{...createActor('did:plc:bad'), handle: 'handle.invalid'}],
    )
    const shares = createRelatedGroup([share('did:plc:sharer')])
    shares.activities[0].record.uri =
      'at://did:plc:sharer/site.standard.document/not-a-post'
    const mismatched = createRelatedGroup([recommend('did:plc:other')])
    mismatched.collection = activityCollections.share
    const unrelated = createRelatedGroup([
      createActivity({collection: activityCollections.subscription}),
    ])
    const document = createActivity({
      relatedActivity: [recommendations, shares, mismatched, unrelated],
    })
    const before = JSON.stringify(document)
    expect(getDocumentSocialProof(document)).toEqual({
      recommenders: [],
      shares: [],
    })
    expect(JSON.stringify(document)).toBe(before)
  })

  it('does not read proof from a shared subject or a non-document activity', () => {
    const recommendation = recommend('did:plc:one')
    recommendation.relatedActivity = [
      createRelatedGroup([share('did:plc:author')]),
    ]
    expect(getDocumentSocialProof(recommendation)).toEqual({
      recommenders: [],
      shares: [],
    })
    const group = createSubjectGroup([recommendation, recommend('did:plc:two')])
    expect(getDocumentSocialProof(group.subject)).toEqual({
      recommenders: [],
      shares: [],
    })
  })
})
