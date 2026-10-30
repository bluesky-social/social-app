import {type l} from '@atproto/lex'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  createActivity,
  createArticleView,
  createGalleryView,
  createLivestreamView,
  createPostView,
  createPublicationView,
} from './testFixtures'
import {activityCollections} from './types'

jest.unmock('multiformats/cid')

describe('Atmosphere generated activity schema', () => {
  it.each([
    [activityCollections.document, createArticleView()],
    [activityCollections.recommendation, createArticleView()],
    [activityCollections.publication, createPublicationView()],
    [activityCollections.subscription, createPublicationView()],
    [activityCollections.grainGallery, createGalleryView()],
    [activityCollections.grainFavorite, createGalleryView()],
    [activityCollections.livestream, createLivestreamView()],
    [activityCollections.share, createPostView()],
  ] as const)('accepts genuine hydrated %s views', (collection, view) => {
    const activity = createActivity({collection, view})
    expect(
      bsky.matches(
        app.bsky.unspecced.getAtmosphereTimeline.activityItem,
        activity,
      ),
    ).toBe(true)
    expect(activity.view).toBe(view)
  })

  it('supports unknown view unions but requires the deployed item fields', () => {
    const schema = app.bsky.unspecced.getAtmosphereTimeline.activityItem
    const activity = createActivity({
      view: {$type: 'example.future#view' as l.Unknown$Type},
    })
    expect(bsky.matches(schema, activity)).toBe(true)
    expect(bsky.matches(schema, {...activity, collection: undefined})).toBe(
      false,
    )
    expect(bsky.isType(schema, {$type: 'example.future#item'})).toBe(false)
  })
})
