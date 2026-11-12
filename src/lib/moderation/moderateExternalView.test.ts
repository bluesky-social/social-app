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

it('merges content labels with the matching owner even when another profile comes first', () => {
  const moderation = moderateExternalView(
    {
      ...view,
      labels: [
        {
          src: 'did:web:labeler.test',
          uri: view.uri,
          val: 'porn',
          cts: '2026-01-01T00:00:00.000Z',
        },
      ],
      associatedProfiles: [
        {did: 'did:web:unrelated.test', handle: 'unrelated.test'},
        {...owner, viewer: {muted: true}},
      ],
    },
    opts,
  )

  expect(moderation.did).toBe(owner.did)
  expect(moderation.muted).toBe(true)
  expect(moderation.ui('contentList').filter).toBe(true)
  expect(moderation.ui('contentMedia').blur).toBe(true)
})

it.each([
  {muted: true},
  {blocking: 'at://did:web:viewer.test/app.bsky.graph.block/1' as const},
  {blockedBy: true},
])('applies the matching owner viewer state %j', viewer => {
  const moderation = moderateExternalView(
    {
      ...view,
      associatedProfiles: [{...owner, viewer}],
    },
    opts,
  )
  expect(moderation.ui('contentList').filter).toBe(true)
})

it('ignores unrelated profiles and does not infer an owner without a matching record DID', () => {
  const unrelated: app.bsky.actor.defs.ProfileViewBasic = {
    did: 'did:web:unrelated.test' as const,
    handle: 'unrelated.test',
    viewer: {muted: true, blockedBy: true},
  }
  for (const subject of [
    {...view, associatedProfiles: [unrelated, owner]},
    {...view, associatedRefs: undefined, associatedProfiles: [unrelated]},
    {
      ...view,
      associatedRefs: [
        {
          ...view.associatedRefs![0],
          uri: 'at://owner.test/site.standard.document/1' as const,
        },
      ],
      associatedProfiles: [unrelated],
    },
  ]) {
    const moderation = moderateExternalView(subject, opts)
    expect(moderation.ui('contentList').filter).toBe(false)
  }
})

it('includes the matching owner account labels', () => {
  const moderation = moderateExternalView(
    {
      ...view,
      associatedProfiles: [
        {
          ...owner,
          labels: [
            {
              src: 'did:web:labeler.test',
              uri: owner.did,
              val: '!hide',
              cts: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      ],
    },
    opts,
  )
  expect(moderation.ui('contentList').filter).toBe(true)
})

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

it('checks gallery image alt text with the same owner context', () => {
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

it.each([
  ['all', true, true],
  ['exclude-following', true, false],
  ['exclude-following', false, true],
] as const)(
  'honors %s muted words for following=%s',
  (actorTarget, following, filtered) => {
    const moderation = moderateExternalView(
      {
        ...view,
        title: 'A spoiler',
        associatedProfiles: [
          {
            ...owner,
            viewer: {
              following: following
                ? 'at://did:web:viewer.test/app.bsky.graph.follow/1'
                : undefined,
            },
          },
        ],
      },
      {
        ...opts,
        prefs: {
          ...opts.prefs,
          mutedWords: [
            {
              value: 'spoiler',
              targets: ['content'],
              actorTarget,
            },
          ],
        },
      },
    )
    expect(moderation.ui('contentList').filter).toBe(filtered)
  },
)

it('retains SDK expiry, target, and own-content muted-word behavior', () => {
  const subject = {...view, title: 'A spoiler'}
  const expired = {
    ...opts,
    prefs: {
      ...opts.prefs,
      mutedWords: [
        {
          value: 'spoiler',
          targets: ['content'],
          expiresAt: '2000-01-01T00:00:00.000Z',
        },
      ],
    },
  } satisfies ModerationOpts
  const tagsOnly = {
    ...opts,
    prefs: {
      ...opts.prefs,
      mutedWords: [
        {
          value: 'spoiler',
          targets: ['tag'],
        },
      ],
    },
  } satisfies ModerationOpts
  expect(moderateExternalView(subject, expired).ui('contentList').filter).toBe(
    false,
  )
  expect(moderateExternalView(subject, tagsOnly).ui('contentList').filter).toBe(
    false,
  )
  expect(
    moderateExternalView(subject, {...opts, userDid: owner.did}).ui(
      'contentList',
    ).filter,
  ).toBe(false)
})
