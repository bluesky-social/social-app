import {type l} from '@atproto/lex'
import {describe, expect, it} from '@jest/globals'

import {type ActivityPresentationItem} from './presentation'
import {
  getActivityRowKind,
  getArticleActivityUri,
  getShareActivities,
  getSubscriptionActivityUri,
} from './rowLayout'
import {
  createActivity,
  createActor,
  createArticleView,
  createGalleryView,
  createLivestreamView,
  createPostView,
  createPublicationView,
  createRow,
  documentUri,
  present,
  publicationUri,
} from './testFixtures'
import {activityCollections, isSubjectGroup} from './types'

jest.unmock('multiformats/cid')

function kind(item: ActivityPresentationItem) {
  return getActivityRowKind(present(item))
}

describe('Atmosphere row layout classification', () => {
  it('requires usable hydrated article content, not just a subscription signal', () => {
    const activity = createActivity({subscribed: true})
    const row = createRow([activity])
    expect(kind(row)).toBe('card')
    for (const view of [
      createArticleView({title: '  '}),
      createArticleView({uri: 'javascript:bad'}),
      {$type: 'example.future#article' as l.Unknown$Type},
      undefined,
    ]) {
      activity.view = view
      expect(kind(row)).toBe('footnote')
    }
  })

  it('uses the shared subject target even when action views are unavailable', () => {
    const first = createActivity({
      collection: activityCollections.recommendation,
      did: 'did:plc:one',
    })
    const second = createActivity({
      collection: activityCollections.recommendation,
      did: 'did:plc:two',
    })
    const row = createRow([first, second], {
      subject: {
        uri: `${documentUri}-shared`,
        viewerState: {subscribed: false},
        view: createArticleView(),
      },
    })
    expect(getArticleActivityUri(row)).toBe(`${documentUri}-shared`)
    expect(kind(row)).toBe('card')
    if (row.type !== 'group' || !isSubjectGroup(row.group))
      throw new Error('Expected subject group')
    expect(row.group.activities.every(activity => !('view' in activity))).toBe(
      true,
    )
    row.group.subject.uri = publicationUri
    expect(getArticleActivityUri(row)).toBeUndefined()
    expect(kind(row)).toBe('footnote')
  })

  it('requires a supplied publication and uses the subject URI instead of unknown member targets', () => {
    const view = createPublicationView({associatedRefs: []})
    const row = createRow(
      [
        createActivity({
          collection: activityCollections.subscription,
          did: 'did:plc:one',
          view,
        }),
        createActivity({
          collection: activityCollections.subscription,
          did: 'did:plc:two',
        }),
      ],
      {subject: publicationUri},
    )
    expect(getSubscriptionActivityUri(row)).toBe(publicationUri)
    expect(kind(row)).toBe('card')
    view.title = ''
    expect(kind(row)).toBe('footnote')
    view.title = 'Publication'
    view.uri = 'javascript:bad'
    expect(kind(row)).toBe('footnote')
    const standalone = createActivity({
      collection: activityCollections.subscription,
      view: createPublicationView({associatedRefs: []}),
    })
    expect(getSubscriptionActivityUri(createRow([standalone]))).toBeUndefined()
  })

  it.each([
    activityCollections.grainGallery,
    activityCollections.grainFavorite,
  ])('uses only supplied gallery media for %s', collection => {
    const activity = createActivity({collection})
    const row = createRow([activity])
    expect(kind(row)).toBe('footnote')
    activity.view = createGalleryView({
      items: [{$type: 'example.future#video' as l.Unknown$Type}],
    })
    expect(kind(row)).toBe('footnote')
    activity.view = createGalleryView()
    expect(kind(row)).toBe('card')
  })

  it('requires real post content for standalone shares', () => {
    const post = createPostView()
    const activity = createActivity({
      collection: activityCollections.share,
      did: 'did:plc:sharer',
      rkey: 'share',
      view: post,
    })
    const row = createRow([activity])
    expect(kind(row)).toBe('card')
    post.record = {$type: activityCollections.share, text: null}
    expect(kind(row)).toBe('footnote')
    activity.view = createPostView({embed: undefined})
    expect(kind(row)).toBe('footnote')
  })

  it('keeps subject-share refs linkable without fabricating text, views or metrics', () => {
    const row = createRow(
      [
        createActivity({
          collection: activityCollections.share,
          did: 'did:plc:one',
        }),
        createActivity({
          collection: activityCollections.share,
          did: 'did:plc:two',
        }),
      ],
      {
        subject: {
          uri: documentUri,
          viewerState: {subscribed: false},
          view: createArticleView(),
        },
      },
    )
    expect(kind(row)).toBe('card')
    const shares = getShareActivities(row)
    if (row.type !== 'group' || !isSubjectGroup(row.group))
      throw new Error('Expected subject group')
    expect(shares.map(share => share.activity)).toEqual(row.group.activities)
    expect(shares[0].activity).toBe(row.group.activities[0])
    expect(shares[0].actor).toBe(row.group.actors[0])
    expect(shares[0].activity).not.toHaveProperty('view')
    row.group.actors = [createActor('did:plc:other')]
    expect(getShareActivities(row)).toEqual([])
    expect(kind(row)).toBe('footnote')
  })

  it('never uses older actor-group content to promote an unavailable newest item', () => {
    const row = createRow(
      [
        createActivity({collection: activityCollections.publication}),
        createActivity({
          collection: activityCollections.publication,
          rkey: 'older',
          view: createPublicationView(),
        }),
      ],
      {groupBy: 'actor'},
    )
    expect(kind(row)).toBe('footnote')
  })

  it('features safely linked active and ended streams', () => {
    const view = createLivestreamView()
    const first = createActivity({
      collection: activityCollections.livestream,
      view,
    })
    const row = createRow([first])
    expect(kind(row)).toBe('card')
    view.active = false
    expect(kind(row)).toBe('card')
    view.uri = 'javascript:bad'
    expect(kind(row)).toBe('footnote')
    view.uri = 'https://stream.place/author'
    expect(
      kind(
        createRow(
          [
            first,
            createActivity({collection: first.collection, rkey: 'older'}),
          ],
          {groupBy: 'actor'},
        ),
      ),
    ).toBe('card')
  })

  it('handles root publications, unknown collections and missing profiles', () => {
    const publication = createActivity({
      collection: activityCollections.publication,
      view: createPublicationView(),
    })
    expect(kind(createRow([publication]))).toBe('card')
    expect(
      kind(
        createRow([createActivity({collection: 'example.unknown.collection'})]),
      ),
    ).toBe('footnote')
    expect(kind(createRow([publication], {actors: {}}))).toBeUndefined()
  })
})
