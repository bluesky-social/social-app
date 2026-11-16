import {type ModerationOpts} from '@bsky/sdk/moderation'

import {type app} from '#/lexicons'
import {moderateExternalView} from './moderateExternalView'

const owner: app.bsky.actor.defs.ProfileViewBasic = {
  did: 'did:web:owner.test',
  handle: 'owner.test',
}
const opts: ModerationOpts = {
  userDid: 'did:web:viewer.test',
  prefs: {
    adultContentEnabled: true,
    labels: {porn: 'warn'},
    labelers: [{did: 'did:web:labeler.test', labels: {}}],
    mutedWords: [{value: 'spoiler', targets: ['content']}],
    hiddenPosts: [],
  },
}
const view: app.bsky.embed.external.ViewArticle = {
  uri: 'https://owner.test/article',
  title: 'An article',
  description: 'Some text',
  associatedRefs: [
    {
      uri: 'at://did:web:owner.test/site.standard.document/1',
      cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
    },
  ],
  associatedProfiles: [owner],
}

/*
 * The SDK covers owner moderation and muted-word matching itself; these cover
 * which text this app checks.
 */
it.each(['title', 'description'] as const)(
  'applies muted words to %s',
  field => {
    const moderation = moderateExternalView(
      {...view, [field]: 'A SPOILER!'},
      opts,
    )
    expect(moderation.ui('contentList').filter).toBe(true)
    expect(moderation.causes).toEqual([
      expect.objectContaining({type: 'mute-word'}),
    ])
  },
)

it('applies muted words to gallery image alt text', () => {
  const gallery: app.bsky.embed.external.ViewGallery = {
    ...view,
    $type: 'app.bsky.embed.external#viewGallery',
    associatedRefs: [
      {
        ...view.associatedRefs![0],
        uri: 'at://did:web:owner.test/social.grain.gallery/1',
      },
    ],
    items: [
      {
        $type: 'app.bsky.embed.external#viewGalleryImage',
        thumbnail: 'https://owner.test/thumb.jpg',
        fullsize: 'https://owner.test/full.jpg',
        alt: 'A spoiler',
      },
    ],
  }
  expect(moderateExternalView(gallery, opts).ui('contentList').filter).toBe(
    true,
  )
})
