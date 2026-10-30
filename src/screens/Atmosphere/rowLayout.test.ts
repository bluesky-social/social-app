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
  createArticleView,
  createGalleryView,
  createLivestreamView,
  createPostView,
  createPublicationView,
  createRow,
  documentUri,
  present,
  publicationUri,
  recordCid,
} from './testFixtures'
import {activityCollections} from './types'

jest.unmock('multiformats/cid')

function kind(item: ActivityPresentationItem) {
  return getActivityRowKind(present(item))
}

describe('Atmosphere row layout classification', () => {
  it('requires usable hydrated article content, not only a subscription signal', () => {
    const activity = createActivity({subscribed: true})
    const row = createRow([activity])
    expect(kind(row)).toBe('card')
    activity.view = createArticleView({title: '  '})
    expect(kind(row)).toBe('footnote')
    activity.view = createArticleView({uri: 'javascript:bad'})
    expect(kind(row)).toBe('footnote')
    activity.view = {$type: 'example.future#article' as l.Unknown$Type}
    expect(kind(row)).toBe('footnote')
    activity.view = undefined
    expect(kind(row)).toBe('footnote')
  })

  it('requires a supplied publication with a pinned subscription target and usable title/link', () => {
    const view = createPublicationView()
    const first = createActivity({
      collection: activityCollections.subscription,
      did: 'did:plc:one',
      view,
    })
    const second = createActivity({
      collection: activityCollections.subscription,
      did: 'did:plc:two',
      view,
    })
    const row = createRow([first, second], {subject: publicationUri})
    expect(kind(row)).toBe('card')
    expect(getSubscriptionActivityUri(row)).toBe(publicationUri)
    view.title = ''
    expect(kind(row)).toBe('footnote')
    view.title = 'A publication'
    view.uri = 'javascript:bad'
    expect(kind(row)).toBe('footnote')
    view.uri = 'https://publication.example/'
    view.associatedRefs = []
    expect(kind(row)).toBe('footnote')
  })

  it.each([
    activityCollections.grainGallery,
    activityCollections.grainFavorite,
  ])(
    'supports %s and falls back for missing/unsupported gallery media',
    collection => {
      const activity = createActivity({collection})
      const row = createRow([activity])
      expect(kind(row)).toBe('footnote')
      activity.view = createGalleryView({
        items: [{$type: 'example.future#video' as l.Unknown$Type}],
      })
      expect(kind(row)).toBe('footnote')
      activity.view = createGalleryView()
      expect(kind(row)).toBe('card')
    },
  )

  it('promotes a supplied share but falls back when post media or actual record is missing', () => {
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

  it('does not replace pinned targets with an unrelated server group subject', () => {
    const first = createActivity({
      collection: activityCollections.share,
      did: 'did:plc:one',
      view: createPostView(),
    })
    const second = createActivity({
      collection: activityCollections.share,
      did: 'did:plc:two',
      view: createPostView(),
    })
    const row = createRow([first, second], {subject: `${documentUri}-other`})
    expect(getArticleActivityUri(row)).toBeUndefined()
    expect(kind(row)).toBe('footnote')
    if (row.type !== 'group') throw new Error('Expected group')
    row.group.subject = documentUri
    expect(getShareActivities(row).map(share => share.activity)).toEqual([
      first,
      second,
    ])
    second.view = createPostView({
      embed: {
        $type: 'app.bsky.embed.external#view',
        external: {
          uri: 'https://other.example/article',
          title: 'Other',
          description: '',
          associatedRefs: [{uri: `${documentUri}-other`, cid: recordCid}],
        },
      },
    })
    expect(getShareActivities(row).map(share => share.activity)).toEqual([
      first,
    ])
  })

  it('features safely linked active, ended, and actor-group streams', () => {
    const view = createLivestreamView()
    const first = createActivity({
      collection: activityCollections.livestream,
      view,
    })
    const row = createRow([first])
    expect(kind(row)).toBe('card')
    view.active = false
    expect(kind(row)).toBe('card')
    view.active = true
    view.uri = 'javascript:bad'
    expect(kind(row)).toBe('footnote')
    view.uri = 'https://stream.place/author'
    expect(
      kind(
        createRow(
          [
            first,
            createActivity({
              collection: first.collection,
              rkey: 'second',
              view,
            }),
          ],
          {groupBy: 'actor'},
        ),
      ),
    ).toBe('card')
  })

  it('renders root publications while keeping unknown collections and missing profiles safe', () => {
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
