import {getActivityAssociatedPost} from '#/screens/Atmosphere/activityPost'
import {
  createActivity,
  createArticleView,
  createGalleryView,
  createLivestreamView,
  createPostView,
  createPublicationView,
  createRow,
  documentUri,
  publicationUri,
  recordCid,
} from '#/screens/Atmosphere/testFixtures'
import {
  activityCollections,
  type ActivityItem,
} from '#/screens/Atmosphere/types'
import {type app} from '#/lexicons'

// The global CID mock cannot validate real strong-reference CIDs.
jest.unmock('multiformats/cid')

const postUri = 'at://did:plc:poster/app.bsky.feed.post/post'
const secondPostUri = 'at://did:plc:other/app.bsky.feed.post/second'
const secondCid = 'bafyreiaxduxpwdpjgvve3klfs4flkwjwfqiurszw4o6jvjarpqqmeqwiza'
const postRef = {uri: postUri, cid: recordCid} as const
const expectedPost = {
  ...postRef,
}

function resolve(activity: ActivityItem) {
  return getActivityAssociatedPost(createRow([activity], {actors: {}}))
}

function articleWithRefs(associatedRefs: unknown) {
  return createArticleView({
    associatedRefs:
      associatedRefs as app.bsky.embed.external.ViewArticle['associatedRefs'],
  })
}

function rawPost(overrides: Partial<ActivityItem['record']> = {}) {
  const activity = createActivity({
    collection: activityCollections.share,
    did: 'did:plc:poster',
    rkey: 'post',
  })
  activity.record = {...activity.record, ...overrides}
  return activity
}

describe('Atmosphere associated posts', () => {
  it('prefers bskyPostRef over a different hydrated or associated post', () => {
    const activity = createActivity({
      view: createPostView({uri: secondPostUri, cid: secondCid}),
    })
    activity.bskyPostRef = postRef
    expect(resolve(activity)).toEqual(expectedPost)
  })

  it('resolves bskyPostRef without a hydrated view', () => {
    const activity = createActivity()
    activity.view = undefined
    activity.bskyPostRef = postRef
    expect(resolve(activity)).toEqual(expectedPost)
  })

  it.each([false, true])(
    'resolves own post refs without views (typed=%s)',
    typed => {
      const activity = rawPost()
      if (typed) {
        activity.record.$type =
          'app.bsky.unspecced.getAtmosphereTimeline#activityRecord'
      }
      expect(resolve(activity)).toEqual(expectedPost)
    },
  )

  it('preserves the original hydrated view only for matching URI and CID', () => {
    const view = createPostView(postRef)
    const activity = rawPost()
    activity.view = view
    const result = resolve(activity)
    expect(result).toEqual({...expectedPost, view})
    expect(result?.view).toBe(view)
  })

  it.each([
    {uri: secondPostUri, cid: recordCid},
    {uri: postUri, cid: secondCid},
  ] as const)(
    'keeps the own record ahead of a mismatched hydrated view (%#)',
    ref => {
      const activity = rawPost()
      activity.view = createPostView(ref)
      expect(resolve(activity)).toEqual(expectedPost)
      expect(resolve(activity)).not.toHaveProperty('view')
    },
  )

  it('keeps the own record ahead of external associated refs', () => {
    const activity = rawPost()
    activity.view = createArticleView({
      associatedRefs: [{uri: secondPostUri, cid: secondCid}],
    })
    expect(resolve(activity)).toEqual(expectedPost)
  })

  it('resolves a directly hydrated post independently of the activity actor', () => {
    const view = createPostView(postRef)
    expect(resolve(createActivity({view}))).toEqual({...expectedPost, view})
  })

  it('uses a valid directly hydrated post when the own record is invalid', () => {
    const activity = rawPost({cid: 'invalid-cid'})
    const view = createPostView(postRef)
    activity.view = view
    expect(resolve(activity)).toEqual({...expectedPost, view})
  })

  it('uses explicit associated refs when the own post record is invalid', () => {
    const activity = rawPost({uri: documentUri})
    activity.view = createArticleView({associatedRefs: [postRef]})
    expect(resolve(activity)).toEqual(expectedPost)
  })

  it.each([
    [activityCollections.document, createArticleView],
    [activityCollections.publication, createPublicationView],
    [activityCollections.grainGallery, createGalleryView],
    [activityCollections.livestream, createLivestreamView],
  ] as const)(
    'resolves explicit post refs on %s hydrated views',
    (collection, makeView) => {
      const view = makeView({associatedRefs: [postRef]})
      expect(resolve(createActivity({collection, view}))).toEqual(expectedPost)
    },
  )

  it('chooses the first valid post ref, skipping unrelated and invalid refs', () => {
    const view = articleWithRefs([
      null,
      {uri: postUri},
      {uri: postUri, cid: 'invalid-cid'},
      {uri: documentUri, cid: recordCid},
      {uri: publicationUri, cid: recordCid},
      {uri: 'at://poster.example/app.bsky.feed.post/post', cid: recordCid},
      {uri: `${postUri}#fragment`, cid: recordCid},
      postRef,
      {uri: secondPostUri, cid: secondCid},
    ])
    const activity = createActivity({view})
    expect(resolve(activity)).toEqual(expectedPost)
  })

  it.each([
    '',
    'not-a-uri',
    'https://bsky.app/profile/did:plc:poster/post/post',
    'AT://did:plc:poster/app.bsky.feed.post/post',
    'at://poster.example/app.bsky.feed.post/post',
    'at://did:/app.bsky.feed.post/post',
    'at://did:plc:/app.bsky.feed.post/post',
    'at://did:plc:poster',
    'at://did:plc:poster/app.bsky.feed.post',
    'at://did:plc:poster/app.bsky.feed.post/',
    documentUri,
    publicationUri,
    `${postUri}/extra`,
    `${postUri}/`,
    `${postUri}?query=1`,
    `${postUri}#fragment`,
    `${postUri}#/record`,
    'at://did:plc:poster/app.bsky.feed.post/.',
    'at://did:plc:poster/app.bsky.feed.post/..',
    'at://did:plc:poster/app.bsky.feed.post/%2e%2e',
    'at://did:plc:poster/app.bsky.feed.post/%2fother',
    'at://did:plc:poster/app.bsky.feed.post/with space',
    'at://did:plc:poster/app.bsky.feed.post/back\\slash',
    'at://did:plc:poster/app.bsky.feed.post/unsafe!',
    `at://did:plc:poster/app.bsky.feed.post/${'a'.repeat(513)}`,
  ])(
    'rejects malformed or unsafe post URI from every evidence source: %s',
    uri => {
      const postUri = uri as ActivityItem['record']['uri']
      expect(resolve(rawPost({uri: postUri}))).toBeUndefined()
      const declared = createActivity({view: undefined})
      declared.bskyPostRef = {uri: postUri, cid: recordCid}
      expect(resolve(declared)).toBeUndefined()
      expect(
        resolve(createActivity({view: createPostView({uri: postUri})})),
      ).toBeUndefined()
      expect(
        resolve(
          createActivity({view: articleWithRefs([{uri, cid: recordCid}])}),
        ),
      ).toBeUndefined()
    },
  )

  it.each(['a', 'a'.repeat(512), 'safe-._~:123'])(
    'accepts valid rkey boundaries: %s',
    rkey => {
      const uri = `at://did:plc:poster/app.bsky.feed.post/${rkey}` as const
      expect(resolve(rawPost({uri}))).toEqual({
        uri,
        cid: recordCid,
      })
    },
  )

  it.each([undefined, null, '', 1, 'invalid-cid'])(
    'rejects invalid or missing CIDs from every evidence source (%#)',
    cid => {
      const invalidCid = cid as ActivityItem['record']['cid']
      expect(resolve(rawPost({cid: invalidCid}))).toBeUndefined()
      const declared = createActivity({view: undefined})
      declared.bskyPostRef = {uri: postUri, cid: invalidCid}
      expect(resolve(declared)).toBeUndefined()
      expect(
        resolve(
          createActivity({
            view: createPostView({uri: postUri, cid: invalidCid}),
          }),
        ),
      ).toBeUndefined()
      expect(
        resolve(createActivity({view: articleWithRefs([{uri: postUri, cid}])})),
      ).toBeUndefined()
    },
  )

  it.each([
    undefined,
    null,
    [],
    postRef,
    'not-an-array',
    [null, undefined, {}, {uri: postUri}, {cid: recordCid}],
    [{uri: documentUri, cid: recordCid}],
    [{uri: publicationUri, cid: recordCid}],
  ])(
    'does not invent a post from missing or unusable associated refs (%#)',
    refs => {
      expect(
        resolve(createActivity({view: articleWithRefs(refs)})),
      ).toBeUndefined()
    },
  )

  it('requires the activity collection to identify a raw feed-post record', () => {
    const activity = rawPost()
    activity.collection = activityCollections.document
    expect(resolve(activity)).toBeUndefined()
  })

  it('does not read refs on unrecognized or untyped hydrated views', () => {
    for (const $type of [
      undefined,
      'example.future#view',
      'app.bsky.embed.external#viewExternal',
    ]) {
      const view = {
        ...createArticleView({associatedRefs: [postRef]}),
        $type,
      } as ActivityItem['view']
      expect(resolve(createActivity({view}))).toBeUndefined()
    }
  })

  it('does not infer a post from URLs, publishers, or associated profiles', () => {
    const view = createArticleView({
      uri: postUri,
      description: `Read https://bsky.app/profile/did:plc:poster/post/post ${postUri}`,
      associatedRefs: [{uri: documentUri, cid: recordCid}],
      publisher: createPublicationView({associatedRefs: [postRef]}),
    })
    expect(resolve(createActivity({view}))).toBeUndefined()
  })

  it('never searches quoted posts, raw record content, or nested external refs', () => {
    const view = createPostView({
      uri: documentUri,
      record: {
        $type: 'app.bsky.feed.post',
        text: postUri,
        createdAt: '2026-09-10T12:00:00.000Z',
        embed: {
          $type: 'app.bsky.embed.record',
          record: postRef,
        },
      },
      embed: {
        $type: 'app.bsky.embed.recordWithMedia#view',
        record: {
          $type: 'app.bsky.embed.record#view',
          record: {
            $type: 'app.bsky.embed.record#viewRecord',
            ...postRef,
            author: createPostView().author,
            value: createPostView().record,
            indexedAt: '2026-09-10T12:00:00.000Z',
          },
        },
        media: {
          $type: 'app.bsky.embed.external#view',
          external: {
            uri: 'https://publication.example/article',
            title: 'An article',
            description: postUri,
            associatedRefs: [postRef],
          },
        },
      },
    })
    expect(resolve(createActivity({view}))).toBeUndefined()
  })

  it('never substitutes related shares for the activity’s associated post', () => {
    const activity = createActivity({relatedActivity: [rawPost()]})
    expect(resolve(activity)).toBeUndefined()
  })

  it.each(['actor', 'subject'] as const)(
    'uses only the first child of a %s group',
    groupBy => {
      const row = createRow([rawPost(), rawPost({uri: secondPostUri})], {
        groupBy,
        actors: {},
      })
      expect(getActivityAssociatedPost(row)).toEqual(expectedPost)
    },
  )

  it.each(['actor', 'subject'] as const)(
    'does not search later children or metadata in a %s group',
    groupBy => {
      const later = createActivity({
        view: createArticleView({associatedRefs: [postRef]}),
      })
      const row = createRow([createActivity(), later], {
        groupBy,
        subject: postUri,
        actors: {},
      })
      expect(getActivityAssociatedPost(row)).toBeUndefined()
    },
  )

  it('does not replace an invalid first post with a later grouped post', () => {
    const row = createRow([rawPost({cid: 'invalid-cid'}), rawPost()], {
      actors: {},
    })
    expect(getActivityAssociatedPost(row)).toBeUndefined()
  })

  it('handles an empty group without searching its metadata', () => {
    const row = createRow([rawPost(), rawPost()], {
      subject: postUri,
      actors: {},
    })
    if (row.type !== 'group') throw new Error('Expected a group fixture')
    row.group.items = []
    expect(getActivityAssociatedPost(row)).toBeUndefined()
  })
})
